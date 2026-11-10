import { Hono } from 'hono'
import { and, asc, count, eq, gte, inArray, isNull } from 'drizzle-orm'
import { getDb } from '../shared/db'
import {
  chests,
  dailyVisits,
  doseLogs,
  forumReplies,
  forumTopics,
  medications,
  missions,
  potionPurchases,
  profile,
  rescuedDays,
  routineLogs,
  routines,
  shopPurchases,
  workoutDays,
  workoutLogs,
  workoutPrograms,
} from '../../shared/schema'
import { jsonResponse, requireAdmin, requireUser } from '../shared/auth'
import { loadPointsContext, todayInTz, type PointsContext } from '../shared/pointsStats'
import {
  BACKFILL_DAYS,
  POINTS,
  addDays,
  computeStreak,
  isLate,
  routineDueOn,
  routineIsDone,
  routineModeFor,
  weekStartOf,
  weekdayOf,
  withRoutineMode,
  type RoutineMode,
} from '../../shared/points'
import {
  DEFAULT_MISSIONS,
  MISSION_METRICS,
  STARTER_MISSIONS,
  STREAK_CHEST_EVERY,
  type ChestContents,
  type ChestRarity,
  type ChestView,
  type MissionDefInput,
  type MissionMetric,
  type MissionState,
  type StreakDay,
} from '../../shared/missions'
import { SHOP_ITEMS, ownsItem } from '../../shared/shopCatalog'
import { dateStrInTimezone, isDueOnDate, scheduledInstantsFor } from '../../shared/scheduling'
import type { WorkoutExercise, WorkoutExerciseLog } from '../../shared/types'
import type { Env } from '../env'

type Db = ReturnType<typeof getDb>

const app = new Hono<{ Bindings: Env }>()

async function auth(c: { env: Env; req: { raw: Request } }) {
  const db = getDb(c.env)
  const res = await requireUser(c.req.raw, db)
  return { db, res }
}

async function loadProfile(db: Db, userId: number) {
  const [row] = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1)
  return row
}

async function potionsAvailable(db: Db, userId: number): Promise<number> {
  const [chestRows, [rescued], bought] = await Promise.all([
    db.select({ contents: chests.contents }).from(chests).where(eq(chests.userId, userId)),
    db.select({ value: count() }).from(rescuedDays).where(eq(rescuedDays.userId, userId)),
    db.select({ qty: potionPurchases.qty }).from(potionPurchases).where(eq(potionPurchases.userId, userId)),
  ])
  const earned = chestRows.reduce((s, c) => s + ((c.contents as ChestContents | null)?.potions ?? 0), 0) + bought.reduce((s, r) => s + r.qty, 0)
  return Math.max(0, earned - (rescued?.value ?? 0))
}

async function visitDates(db: Db, userId: number): Promise<Set<string>> {
  const [visits, rescued] = await Promise.all([
    db.select({ date: dailyVisits.date }).from(dailyVisits).where(eq(dailyVisits.userId, userId)),
    db.select({ date: rescuedDays.date }).from(rescuedDays).where(eq(rescuedDays.userId, userId)),
  ])
  return new Set([...visits.map((v) => v.date), ...rescued.map((r) => r.date)])
}

/** Rotinas já feitas a partir de `weekStart` — mudar o modo delas só vale na semana seguinte. */
async function routinesDoneSince(db: Db, userId: number, weekStart: string): Promise<Set<number>> {
  const [rows, logs] = await Promise.all([
    db.select().from(routines).where(eq(routines.userId, userId)),
    db.select().from(routineLogs).where(and(eq(routineLogs.userId, userId), gte(routineLogs.date, weekStart))),
  ])
  const byId = new Map(rows.map((r) => [r.id, r]))
  return new Set(
    logs
      .filter((l) => {
        const r = byId.get(l.routineId)
        return r ? routineIsDone(r, l.count) : false
      })
      .map((l) => l.routineId),
  )
}

// ---------- pontos ----------

app.get('/api/points', async (c) => {
  const { db, res } = await auth(c)
  if (res instanceof Response) return res
  try {
    return jsonResponse((await loadPointsContext(db, res.user.id)).points)
  } catch (err) {
    console.error('points error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

// ---------- visita diária (streak + popup) ----------

app.post('/api/visit', async (c) => {
  const { db, res } = await auth(c)
  if (res instanceof Response) return res
  const userId = res.user.id
  try {
    const prof = await loadProfile(db, userId)
    if (!prof) return jsonResponse({ error: 'perfil não encontrado' }, { status: 404 })
    const today = todayInTz(prof.timezone ?? 'America/Sao_Paulo')
    const dates = await visitDates(db, userId)
    const yesterday = addDays(today, -1)

    if (dates.has(today)) {
      return jsonResponse({ isNew: false, streak: computeStreak(dates, today).streak, points: 0, chest: false })
    }
    const before = computeStreak(dates, today) // como estava antes de abrir hoje
    dates.add(today)
    const after = computeStreak(dates, today)
    const [inserted] = await db
      .insert(dailyVisits)
      .values({ userId, date: today, streak: after.streak, points: POINTS.visit })
      .onConflictDoNothing()
      .returning()
    if (!inserted) return jsonResponse({ isNew: false, streak: after.streak, points: 0, chest: false })

    let chest = false
    if (after.streak % STREAK_CHEST_EVERY === 0) {
      const [c2] = await db
        .insert(chests)
        .values({ userId, source: `streak${STREAK_CHEST_EVERY}:${today}`, rarity: 'rare' })
        .onConflictDoNothing()
        .returning()
      chest = !!c2
    }

    // ontem ficou sem abrir: ou a folga cobriu (💤), ou o streak quebrou — aí dá pra salvar com poção
    const yesterdayStatus = after.days.get(yesterday)
    let brokenStreak = 0
    if (yesterdayStatus === 'missed') brokenStreak = computeStreak(dates, addDays(today, -2)).streak
    const potions = brokenStreak > 0 ? await potionsAvailable(db, userId) : 0

    return jsonResponse({
      isNew: true,
      streak: after.streak,
      points: POINTS.visit,
      chest,
      usedRestDay: yesterdayStatus === 'rest',
      restDaysLeft: after.restDaysLeft,
      gotRestDay: after.restDaysLeft > before.restDaysLeft,
      brokenStreak,
      potions,
    })
  } catch (err) {
    console.error('visit error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

// ---------- poção do tempo ----------

app.post('/api/potions/use', async (c) => {
  const { db, res } = await auth(c)
  if (res instanceof Response) return res
  const userId = res.user.id
  try {
    const { date } = (await c.req.json()) as { date?: string }
    const prof = await loadProfile(db, userId)
    const today = todayInTz(prof?.timezone ?? 'America/Sao_Paulo')
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date >= today || date < addDays(today, -BACKFILL_DAYS)) {
      return jsonResponse({ error: `a poção só funciona nos últimos ${BACKFILL_DAYS} dias (antes de hoje)` }, { status: 400 })
    }
    if ((await potionsAvailable(db, userId)) < 1) return jsonResponse({ error: 'você não tem poção' }, { status: 400 })
    const [row] = await db.insert(rescuedDays).values({ userId, date }).onConflictDoNothing().returning()
    if (!row) return jsonResponse({ error: 'esse dia já foi salvo' }, { status: 409 })

    // o streak de hoje pode ter mudado (dia do buraco foi preenchido)
    const dates = await visitDates(db, userId)
    const streak = computeStreak(dates, today).streak
    if (dates.has(today)) {
      await db
        .update(dailyVisits)
        .set({ streak })
        .where(and(eq(dailyVisits.userId, userId), eq(dailyVisits.date, today)))
    }
    return jsonResponse({ ok: true, potions: await potionsAvailable(db, userId), streak })
  } catch (err) {
    console.error('potion error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

// ---------- Semana Perfeita (modo de cada rotina) ----------

/** Muda o modo das rotinas. `when: 'now'` só vale pras que ainda não foram feitas nessa semana (as
 * outras ficam pra segunda); `'next'` é sempre a partir da próxima segunda. */
export async function setRoutineModes(db: Db, userId: number, ids: number[] | 'all', mode: RoutineMode, when: 'now' | 'next') {
  const prof = await loadProfile(db, userId)
  const today = todayInTz(prof?.timezone ?? 'America/Sao_Paulo')
  const current = weekStartOf(today)
  const next = addDays(current, 7)
  const rows = (await db.select().from(routines).where(eq(routines.userId, userId))).filter((r) => ids === 'all' || ids.includes(r.id))
  const done = when === 'now' ? await routinesDoneSince(db, userId, current) : new Set<number>()
  const result: { routineId: number; from: string }[] = []
  for (const r of rows) {
    const from = when === 'now' && !done.has(r.id) ? current : next
    result.push({ routineId: r.id, from })
    // já está nesse modo daqui pra frente: não mexe
    if (routineModeFor(r.modeHistory, from) === mode && routineModeFor(r.modeHistory, addDays(from, 7)) === mode) continue
    await db
      .update(routines)
      .set({ modeHistory: withRoutineMode(r.modeHistory, from, mode) })
      .where(eq(routines.id, r.id))
  }
  return result
}

app.post('/api/routine-mode', async (c) => {
  const { db, res } = await auth(c)
  if (res instanceof Response) return res
  try {
    const body = (await c.req.json()) as { routineIds?: number[] | 'all'; mode?: RoutineMode; when?: 'now' | 'next' }
    if (body.mode !== 'daily' && body.mode !== 'weekly') return jsonResponse({ error: 'mode precisa ser daily ou weekly' }, { status: 400 })
    const ids = body.routineIds === 'all' ? 'all' : (body.routineIds ?? []).filter((n) => Number.isInteger(n))
    return jsonResponse(await setRoutineModes(db, res.user.id, ids, body.mode, body.when === 'now' ? 'now' : 'next'))
  } catch (err) {
    console.error('routine mode error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

// Convites: o primeiro (uma vez só, ao concluir uma rotina) e o de "quase fez a semana perfeita"
// (no máximo um por semana, olhando a semana passada das rotinas no modo todo dia).
app.get('/api/challenge', async (c) => {
  const { db, res } = await auth(c)
  if (res instanceof Response) return res
  try {
    const ctx = await loadPointsContext(db, res.user.id)
    const prof = await loadProfile(db, res.user.id)
    const week = ctx.points.week.weekStart
    const routineRows = await db.select().from(routines).where(eq(routines.userId, res.user.id))
    const stillDaily = new Set(routineRows.filter((r) => r.active && routineModeFor(r.modeHistory, week) === 'daily').map((r) => r.id))
    const almost =
      prof?.challengePromptWeek === week ? [] : ctx.points.lastWeekDaily.filter((r) => stillDaily.has(r.routineId) && r.due >= 3 && r.done >= r.due - 1)
    const done = await routinesDoneSince(db, res.user.id, week)
    return jsonResponse({
      introSeen: prof?.challengeIntroSeen ?? false,
      almost: almost.map((r) => ({ ...r, canStartNow: !done.has(r.routineId) })),
    })
  } catch (err) {
    console.error('challenge error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

app.post('/api/challenge/seen', async (c) => {
  const { db, res } = await auth(c)
  if (res instanceof Response) return res
  const { kind } = (await c.req.json()) as { kind?: 'intro' | 'almost' }
  const prof = await loadProfile(db, res.user.id)
  const week = weekStartOf(todayInTz(prof?.timezone ?? 'America/Sao_Paulo'))
  await db
    .update(profile)
    .set(kind === 'intro' ? { challengeIntroSeen: true } : { challengePromptWeek: week })
    .where(eq(profile.userId, res.user.id))
  return jsonResponse({ ok: true })
})

// ---------- missões e baús ----------

async function missionDefs(db: Db) {
  let rows = await db.select().from(missions).orderBy(asc(missions.sortOrder), asc(missions.id))
  if (rows.length === 0) {
    // primeira vez: cria as padrão (o admin edita a partir daí)
    await db.insert(missions).values(DEFAULT_MISSIONS)
    rows = await db.select().from(missions).orderBy(asc(missions.sortOrder), asc(missions.id))
  }
  return rows
}

async function forumCounts(db: Db, userId: number, today: string, weekStart: string, timeZone: string) {
  const since = new Date(`${addDays(weekStart, -1)}T00:00:00.000Z`)
  const [topics, replies, [allTopics], [allReplies]] = await db.batch([
    db.select({ createdAt: forumTopics.createdAt }).from(forumTopics).where(and(eq(forumTopics.userId, userId), gte(forumTopics.createdAt, since))),
    db.select({ createdAt: forumReplies.createdAt }).from(forumReplies).where(and(eq(forumReplies.userId, userId), gte(forumReplies.createdAt, since))),
    db.select({ value: count() }).from(forumTopics).where(eq(forumTopics.userId, userId)),
    db.select({ value: count() }).from(forumReplies).where(eq(forumReplies.userId, userId)),
  ])
  const dates = [...topics, ...replies].map((r) => dateStrInTimezone(r.createdAt, timeZone))
  return {
    today: dates.filter((d) => d === today).length,
    week: dates.filter((d) => d >= weekStart && d <= today).length,
    ever: (allTopics?.value ?? 0) + (allReplies?.value ?? 0),
  }
}

const METRIC_LINK: Record<MissionMetric, string> = {
  daylog: '/dia',
  routines_done: '/routines',
  routine_days: '/routines',
  meds_on_time: '/',
  workouts: '/treinos',
  workout_goal: '/treinos',
  likes: '/feed',
  comments: '/feed',
  posts: '/feed',
  social: '/feed',
  forum: '/comunidades',
  visits: '/missoes',
}

async function missionStates(db: Db, userId: number, ctx: PointsContext): Promise<MissionState[]> {
  const w = ctx.points.week
  const t = ctx.points.today
  const [defs, forum] = await Promise.all([missionDefs(db), forumCounts(db, userId, ctx.today, w.weekStart, ctx.timeZone)])

  const starterDone: Record<string, boolean> = {
    first_med: ctx.counts.medications > 0,
    first_routine: ctx.counts.routines > 0,
    avatar: ctx.counts.hasAvatar,
    forum: forum.ever > 0,
    first_post: ctx.counts.posts > 0,
  }
  const starterCount = Object.values(starterDone).filter(Boolean).length
  const starter: MissionState[] = STARTER_MISSIONS.map((m) => {
    const source = `m:${m.key}`
    const progress = m.key === 'all_starter' ? starterCount : starterDone[m.key] ? 1 : 0
    return {
      key: `starter:${m.key}`,
      group: 'starter',
      title: m.title,
      description: m.description,
      target: m.target,
      progress: Math.min(progress, m.target),
      rewardKind: 'chest',
      rewardRarity: m.rarity,
      rewardAmount: 0,
      to: m.to,
      hidden: false,
      claimed: ctx.chestSources.has(source),
      source,
    }
  })

  const isSunday = weekdayOf(ctx.today) === 0
  const weekVisits = [...ctx.visitDates].filter((d) => d >= w.weekStart && d <= ctx.today).length
  const periodic: MissionState[] = defs
    .filter((d) => d.active && d.metric in MISSION_METRICS)
    .map((d) => {
      const daily = d.period === 'daily'
      const c = daily ? t : w
      const metric = d.metric as MissionMetric
      let progress = 0
      let target = d.target
      let hidden = false
      switch (metric) {
        case 'daylog':
          progress = c.dayLogDays
          break
        case 'routines_done':
          progress = c.routinesDone
          hidden = ctx.counts.routines === 0
          break
        case 'routine_days':
          progress = c.routineDays
          hidden = ctx.counts.routines === 0
          break
        case 'meds_on_time':
          // na semana só dá pra saber no domingo se foi certinho
          progress = c.medsOnTime && (daily || isSunday) ? 1 : 0
          target = 1
          hidden = c.medsDue === 0
          break
        case 'workouts':
          progress = c.workouts
          hidden = w.workoutGoal === 0
          break
        case 'workout_goal':
          progress = c.workouts
          target = daily ? 1 : Math.max(1, w.workoutGoal)
          hidden = w.workoutGoal === 0
          break
        case 'likes':
          progress = c.likes
          break
        case 'comments':
          progress = c.comments
          break
        case 'posts':
          progress = c.posts
          break
        case 'social':
          progress = c.likes + c.comments + c.posts
          break
        case 'forum':
          progress = daily ? forum.today : forum.week
          break
        case 'visits':
          progress = daily ? (ctx.visitDates.has(ctx.today) ? 1 : 0) : weekVisits
          break
      }
      const source = daily ? `d:${ctx.today}:${d.id}` : `w:${w.weekStart}:${d.id}`
      return {
        key: String(d.id),
        group: d.period as 'daily' | 'weekly',
        title: d.title,
        description: d.description,
        target,
        progress: Math.min(progress, target),
        rewardKind: d.rewardKind as MissionState['rewardKind'],
        rewardRarity: d.rewardRarity as ChestRarity,
        rewardAmount: d.rewardAmount,
        to: METRIC_LINK[metric],
        hidden,
        claimed: ctx.chestSources.has(source),
        source,
      }
    })

  return [...starter, ...periodic]
}

function toChestView(row: typeof chests.$inferSelect): ChestView {
  return {
    id: row.id,
    source: row.source,
    rarity: row.rarity as ChestRarity,
    contents: (row.contents as ChestContents | null) ?? null,
    openedAt: row.openedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

function streakWeek(ctx: PointsContext): StreakDay[] {
  const { days } = computeStreak(ctx.visitDates, ctx.today)
  const start = ctx.points.week.weekStart
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i)
    if (date > ctx.today) return { date, status: 'future' as const }
    return { date, status: days.get(date) ?? 'none' }
  })
}

app.get('/api/missions', async (c) => {
  const { db, res } = await auth(c)
  if (res instanceof Response) return res
  try {
    const ctx = await loadPointsContext(db, res.user.id)
    const [list, chestRows] = await Promise.all([
      missionStates(db, res.user.id, ctx),
      db.select().from(chests).where(and(eq(chests.userId, res.user.id), isNull(chests.openedAt))),
    ])
    chestRows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return jsonResponse({
      missions: list,
      dailyUnlocked: list.filter((m) => m.group === 'starter').every((m) => m.claimed),
      chests: chestRows.map(toChestView),
      potions: ctx.points.potions,
      streak: ctx.points.visitStreak,
      restDaysLeft: ctx.points.restDaysLeft,
      streakWeek: streakWeek(ctx),
      rescued: [...ctx.rescued],
      today: ctx.today,
    })
  } catch (err) {
    console.error('missions error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

app.post('/api/missions/claim', async (c) => {
  const { db, res } = await auth(c)
  if (res instanceof Response) return res
  try {
    const { key } = (await c.req.json()) as { key?: string }
    const ctx = await loadPointsContext(db, res.user.id)
    const list = await missionStates(db, res.user.id, ctx)
    const mission = list.find((m) => m.key === key)
    if (!mission || mission.hidden) return jsonResponse({ error: 'missão não existe' }, { status: 404 })
    if (mission.group === 'daily' && !list.filter((m) => m.group === 'starter').every((m) => m.claimed)) {
      return jsonResponse({ error: 'complete as boas-vindas primeiro' }, { status: 400 })
    }
    if (mission.claimed) return jsonResponse({ error: 'você já pegou essa recompensa' }, { status: 409 })
    if (mission.progress < mission.target) return jsonResponse({ error: 'missão ainda não completa' }, { status: 400 })

    // Brilho e poção entram como um "baú já aberto" — assim tudo soma pelo mesmo lugar
    const instant: ChestContents | null =
      mission.rewardKind === 'brilho'
        ? { brilho: Math.max(0, mission.rewardAmount), potions: 0, itemKey: null }
        : mission.rewardKind === 'potion'
          ? { brilho: 0, potions: Math.max(1, mission.rewardAmount), itemKey: null }
          : null
    const [row] = await db
      .insert(chests)
      .values({ userId: res.user.id, source: mission.source, rarity: mission.rewardRarity, contents: instant, openedAt: instant ? new Date() : null })
      .onConflictDoNothing()
      .returning()
    if (!row) return jsonResponse({ error: 'você já pegou essa recompensa' }, { status: 409 })
    return jsonResponse(toChestView(row), { status: 201 })
  } catch (err) {
    console.error('claim error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

// ---------- admin: missões diárias e semanais ----------

function validateMission(body: Partial<MissionDefInput>): string | null {
  if (body.period !== 'daily' && body.period !== 'weekly') return 'período precisa ser diária ou semanal'
  if (!body.metric || !(body.metric in MISSION_METRICS)) return 'escolha o que a missão mede'
  if (!Number.isInteger(body.target) || (body.target ?? 0) < 1 || (body.target ?? 0) > 100) return 'meta entre 1 e 100'
  if (!body.title?.trim() || body.title.length > 80) return 'título de 1 a 80 letras'
  if ((body.description ?? '').length > 200) return 'descrição até 200 letras'
  if (!['chest', 'brilho', 'potion'].includes(body.rewardKind ?? '')) return 'recompensa inválida'
  if (body.rewardKind === 'chest' && !['common', 'rare'].includes(body.rewardRarity ?? '')) return 'baú comum ou raro'
  if (body.rewardKind !== 'chest' && (!Number.isInteger(body.rewardAmount) || (body.rewardAmount ?? 0) < 1 || (body.rewardAmount ?? 0) > 200)) {
    return 'quantidade da recompensa entre 1 e 200'
  }
  return null
}

function missionValues(body: MissionDefInput) {
  return {
    period: body.period,
    metric: body.metric,
    target: body.target,
    title: body.title.trim(),
    description: (body.description ?? '').trim(),
    rewardKind: body.rewardKind,
    rewardRarity: body.rewardRarity ?? 'common',
    rewardAmount: body.rewardKind === 'chest' ? 0 : body.rewardAmount,
    active: body.active !== false,
    sortOrder: Number.isInteger(body.sortOrder) ? body.sortOrder : 0,
  }
}

app.get('/api/admin/missions', async (c) => {
  const db = getDb(c.env)
  const a = await requireAdmin(c.req.raw, db)
  if (a instanceof Response) return a
  return jsonResponse(await missionDefs(db))
})

app.post('/api/admin/missions', async (c) => {
  const db = getDb(c.env)
  const a = await requireAdmin(c.req.raw, db)
  if (a instanceof Response) return a
  const body = (await c.req.json()) as MissionDefInput
  const error = validateMission(body)
  if (error) return jsonResponse({ error }, { status: 400 })
  const [row] = await db.insert(missions).values(missionValues(body)).returning()
  return jsonResponse(row, { status: 201 })
})

app.put('/api/admin/missions/:id', async (c) => {
  const db = getDb(c.env)
  const a = await requireAdmin(c.req.raw, db)
  if (a instanceof Response) return a
  const body = (await c.req.json()) as MissionDefInput
  const error = validateMission(body)
  if (error) return jsonResponse({ error }, { status: 400 })
  const [row] = await db
    .update(missions)
    .set(missionValues(body))
    .where(eq(missions.id, Number(c.req.param('id'))))
    .returning()
  return row ? jsonResponse(row) : jsonResponse({ error: 'missão não encontrada' }, { status: 404 })
})

app.delete('/api/admin/missions/:id', async (c) => {
  const db = getDb(c.env)
  const a = await requireAdmin(c.req.raw, db)
  if (a instanceof Response) return a
  await db.delete(missions).where(eq(missions.id, Number(c.req.param('id'))))
  return jsonResponse({ ok: true })
})

function randInt(min: number, max: number): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return min + (buf[0] % (max - min + 1))
}

const CHEST_TABLE: Record<ChestRarity, { brilho: [number, number]; potionPct: number; itemPct: number; itemMaxPrice: number }> = {
  common: { brilho: [10, 25], potionPct: 30, itemPct: 15, itemMaxPrice: 40 },
  rare: { brilho: [25, 50], potionPct: 60, itemPct: 40, itemMaxPrice: 80 },
}

app.post('/api/chests/:id/open', async (c) => {
  const { db, res } = await auth(c)
  if (res instanceof Response) return res
  const userId = res.user.id
  try {
    const id = Number(c.req.param('id'))
    const [row] = await db.select().from(chests).where(and(eq(chests.id, id), eq(chests.userId, userId))).limit(1)
    if (!row) return jsonResponse({ error: 'baú não encontrado' }, { status: 404 })
    if (row.openedAt) return jsonResponse(toChestView(row))

    const table = CHEST_TABLE[row.rarity as ChestRarity] ?? CHEST_TABLE.common
    let brilho = randInt(table.brilho[0], table.brilho[1])
    const potions = randInt(1, 100) <= table.potionPct ? 1 : 0
    let itemKey: string | null = null
    if (randInt(1, 100) <= table.itemPct) {
      const owned = (await db.select({ itemKey: shopPurchases.itemKey }).from(shopPurchases).where(eq(shopPurchases.userId, userId))).map((p) => p.itemKey)
      const pool = SHOP_ITEMS.filter((i) => i.kind !== 'bundle' && i.price > 0 && i.price <= table.itemMaxPrice && !ownsItem(owned, i.key))
      if (pool.length > 0) itemKey = pool[randInt(0, pool.length - 1)].key
      else brilho += 15 // já tem tudo que cabia no baú: vira Brilho
    }
    const contents: ChestContents = { brilho, potions, itemKey }

    // só abre se ainda estava fechado (clique duplo não sorteia duas vezes)
    const [opened] = await db
      .update(chests)
      .set({ contents, openedAt: new Date() })
      .where(and(eq(chests.id, id), eq(chests.userId, userId), isNull(chests.openedAt)))
      .returning()
    if (!opened) {
      const [again] = await db.select().from(chests).where(eq(chests.id, id)).limit(1)
      return jsonResponse(toChestView(again))
    }
    if (itemKey) await db.insert(shopPurchases).values({ userId, itemKey, price: 0 }).onConflictDoNothing()
    return jsonResponse(toChestView(opened))
  } catch (err) {
    console.error('chest open error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

// ---------- "e ontem?" + doses esquecidas ----------

interface PendingDoseGroup {
  medicationId: number
  name: string
  doseAmount: string
  doseUnit: string
  instances: { scheduledFor: string; date: string }[]
}

app.get('/api/checkin', async (c) => {
  const { db, res } = await auth(c)
  if (res instanceof Response) return res
  const userId = res.user.id
  try {
    const prof = await loadProfile(db, userId)
    if (!prof) return jsonResponse({ review: null, doses: [], potions: 0 })
    const tz = prof.timezone ?? 'America/Sao_Paulo'
    const today = todayInTz(tz)
    const yesterday = addDays(today, -1)
    const accountDate = dateStrInTimezone(prof.createdAt, tz)

    // 1) rotinas e treinos de ontem que não foram marcados
    let review: { date: string; routines: { id: number; name: string; icon: string }[]; workouts: { dayId: number; name: string; programName: string }[] } | null = null
    if ((prof.lastDayReviewed ?? '') < yesterday && accountDate <= yesterday) {
      const [routineRows, logRows, programRows, dayRows, wLogs] = await Promise.all([
        db.select().from(routines).where(eq(routines.userId, userId)),
        db.select().from(routineLogs).where(and(eq(routineLogs.userId, userId), eq(routineLogs.date, yesterday))),
        db.select().from(workoutPrograms).where(eq(workoutPrograms.userId, userId)),
        db
          .select({ id: workoutDays.id, programId: workoutDays.programId, name: workoutDays.name, daysOfWeek: workoutDays.daysOfWeek })
          .from(workoutDays)
          .innerJoin(workoutPrograms, eq(workoutDays.programId, workoutPrograms.id))
          .where(eq(workoutPrograms.userId, userId)),
        db.select().from(workoutLogs).where(and(eq(workoutLogs.userId, userId), eq(workoutLogs.date, yesterday))),
      ])
      const pendingRoutines = routineRows.filter((r) => {
        if (!r.active || dateStrInTimezone(r.createdAt, tz) > yesterday || !routineDueOn(r, yesterday)) return false
        const log = logRows.find((l) => l.routineId === r.id)
        return !log || !routineIsDone(r, log.count)
      })
      const weekday = weekdayOf(yesterday)
      const doneDayIds = new Set(wLogs.map((l) => l.workoutDayId))
      const pendingWorkouts = dayRows.filter((d) => {
        const program = programRows.find((p) => p.id === d.programId)
        if (!program?.active || dateStrInTimezone(program.createdAt, tz) > yesterday) return false
        return ((d.daysOfWeek as number[] | null) ?? []).includes(weekday) && !doneDayIds.has(d.id)
      })
      if (pendingRoutines.length || pendingWorkouts.length) {
        review = {
          date: yesterday,
          routines: pendingRoutines.map((r) => ({ id: r.id, name: r.name, icon: r.icon })),
          workouts: pendingWorkouts.map((d) => ({ dayId: d.id, name: d.name, programName: programRows.find((p) => p.id === d.programId)?.name ?? '' })),
        }
      }
    }

    // 2) doses dos últimos 10 dias sem resposta (sem registro ou marcadas como perdidas pelo sistema)
    const from = addDays(today, -BACKFILL_DAYS)
    const [medRows, logRows] = await Promise.all([
      db.select().from(medications).where(and(eq(medications.userId, userId), eq(medications.active, true))),
      db
        .select()
        .from(doseLogs)
        .where(and(eq(doseLogs.userId, userId), gte(doseLogs.scheduledFor, new Date(`${addDays(from, -1)}T00:00:00.000Z`)))),
    ])
    const doses: PendingDoseGroup[] = []
    for (const med of medRows) {
      const created = dateStrInTimezone(med.createdAt, tz)
      const instances: PendingDoseGroup['instances'] = []
      for (let d = from > created ? from : created; d <= yesterday; d = addDays(d, 1)) {
        if (!isDueOnDate(med, d, tz)) continue
        for (const at of scheduledInstantsFor(med, d, tz)) {
          const log = logRows.find((l) => l.medicationId === med.id && new Date(l.scheduledFor).getTime() === at.getTime())
          if (!log || log.status === 'missed' || log.status === 'pending') instances.push({ scheduledFor: at.toISOString(), date: d })
        }
      }
      if (instances.length) doses.push({ medicationId: med.id, name: med.name, doseAmount: med.doseAmount, doseUnit: med.doseUnit, instances })
    }

    return jsonResponse({ today, review, doses, potions: await potionsAvailable(db, userId) })
  } catch (err) {
    console.error('checkin get error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

app.post('/api/checkin/review', async (c) => {
  const { db, res } = await auth(c)
  if (res instanceof Response) return res
  const userId = res.user.id
  try {
    const body = (await c.req.json()) as { date?: string; routineIds?: number[]; workoutDayIds?: number[] }
    const prof = await loadProfile(db, userId)
    const today = todayInTz(prof?.timezone ?? 'America/Sao_Paulo')
    const date = body.date
    if (!date || date !== addDays(today, -1)) return jsonResponse({ error: 'só dá pra responder sobre ontem' }, { status: 400 })
    const routineIds = (body.routineIds ?? []).filter((n) => Number.isInteger(n)).slice(0, 50)
    const workoutDayIds = (body.workoutDayIds ?? []).filter((n) => Number.isInteger(n)).slice(0, 20)

    if (routineIds.length) {
      const owned = await db.select().from(routines).where(and(eq(routines.userId, userId), inArray(routines.id, routineIds)))
      const existing = await db.select().from(routineLogs).where(and(eq(routineLogs.userId, userId), eq(routineLogs.date, date)))
      for (const r of owned) {
        const full = r.type === 'checkbox' ? 1 : (r.targetCount ?? 1)
        const log = existing.find((l) => l.routineId === r.id)
        if (log) await db.update(routineLogs).set({ count: Math.max(log.count, full) }).where(eq(routineLogs.id, log.id))
        else await db.insert(routineLogs).values({ userId, routineId: r.id, date, count: full })
      }
    }
    if (workoutDayIds.length) {
      const days = await db
        .select({ id: workoutDays.id, exercises: workoutDays.exercises })
        .from(workoutDays)
        .innerJoin(workoutPrograms, eq(workoutDays.programId, workoutPrograms.id))
        .where(and(eq(workoutPrograms.userId, userId), inArray(workoutDays.id, workoutDayIds)))
      for (const d of days) {
        const setLogs: WorkoutExerciseLog[] = ((d.exercises as WorkoutExercise[] | null) ?? []).map((ex) => ({
          name: ex.name,
          sets: Array.from({ length: Math.max(1, ex.sets) }, () => ({ weight: null, reps: null, done: true })),
        }))
        await db.insert(workoutLogs).values({ userId, workoutDayId: d.id, date, setLogs }).onConflictDoNothing()
      }
    }
    await db.update(profile).set({ lastDayReviewed: date }).where(eq(profile.userId, userId))
    return jsonResponse({ ok: true })
  } catch (err) {
    console.error('checkin review error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

app.post('/api/checkin/doses', async (c) => {
  const { db, res } = await auth(c)
  if (res instanceof Response) return res
  const userId = res.user.id
  try {
    const body = (await c.req.json()) as { entries?: { medicationId: number; scheduledFor: string; taken: boolean }[] }
    const entries = (body.entries ?? []).slice(0, 200)
    const prof = await loadProfile(db, userId)
    const tz = prof?.timezone ?? 'America/Sao_Paulo'
    const now = new Date()
    const oldest = new Date(now.getTime() - (BACKFILL_DAYS + 1) * 86_400_000)
    const medIds = [...new Set(entries.map((e) => e.medicationId))].filter((n) => Number.isInteger(n))
    if (!medIds.length) return jsonResponse({ ok: true })
    const owned = new Set(
      (await db.select({ id: medications.id }).from(medications).where(and(eq(medications.userId, userId), inArray(medications.id, medIds)))).map((m) => m.id),
    )
    const logs = await db.select().from(doseLogs).where(and(eq(doseLogs.userId, userId), gte(doseLogs.scheduledFor, oldest)))

    for (const e of entries) {
      const at = new Date(e.scheduledFor)
      if (!owned.has(e.medicationId) || Number.isNaN(at.getTime()) || at < oldest || at > now) continue
      const status = e.taken ? 'taken' : 'skipped'
      const backfilled = e.taken && isLate(dateStrInTimezone(at, tz), now, tz)
      const takenAt = e.taken ? at : null
      const existing = logs.find((l) => l.medicationId === e.medicationId && new Date(l.scheduledFor).getTime() === at.getTime())
      if (existing) await db.update(doseLogs).set({ status, takenAt, backfilled }).where(eq(doseLogs.id, existing.id))
      else await db.insert(doseLogs).values({ userId, medicationId: e.medicationId, scheduledFor: at, status, takenAt, backfilled })
    }
    return jsonResponse({ ok: true })
  } catch (err) {
    console.error('checkin doses error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
