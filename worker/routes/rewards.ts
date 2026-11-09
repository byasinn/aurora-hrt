import { Hono } from 'hono'
import { and, count, eq, gte, inArray, isNull } from 'drizzle-orm'
import { getDb } from '../shared/db'
import {
  chests,
  communityMembers,
  dailyVisits,
  doseLogs,
  medications,
  profile,
  rescuedDays,
  routineLogs,
  routines,
  shopPurchases,
  workoutDays,
  workoutLogs,
  workoutPrograms,
} from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { loadPointsContext, todayInTz, type PointsContext } from '../shared/pointsStats'
import { BACKFILL_DAYS, POINTS, addDays, isLate, routineDueOn, routineIsDone, streakEndingAt, weekStartOf, weekdayOf } from '../../shared/points'
import {
  STARTER_MISSIONS,
  STREAK_CHEST_EVERY,
  WEEKLY_MISSIONS,
  type ChestContents,
  type ChestRarity,
  type ChestView,
  type MissionState,
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
  const [chestRows, [rescued]] = await Promise.all([
    db.select({ contents: chests.contents }).from(chests).where(eq(chests.userId, userId)),
    db.select({ value: count() }).from(rescuedDays).where(eq(rescuedDays.userId, userId)),
  ])
  const earned = chestRows.reduce((s, c) => s + ((c.contents as ChestContents | null)?.potions ?? 0), 0)
  return Math.max(0, earned - (rescued?.value ?? 0))
}

async function visitDates(db: Db, userId: number): Promise<Set<string>> {
  const [visits, rescued] = await Promise.all([
    db.select({ date: dailyVisits.date }).from(dailyVisits).where(eq(dailyVisits.userId, userId)),
    db.select({ date: rescuedDays.date }).from(rescuedDays).where(eq(rescuedDays.userId, userId)),
  ])
  return new Set([...visits.map((v) => v.date), ...rescued.map((r) => r.date)])
}

/** Já tem rotina feita nessa semana? Aí a aposta da semana atual não pode mais ser ligada. */
async function hasRoutineDoneSince(db: Db, userId: number, weekStart: string): Promise<boolean> {
  const [rows, logs] = await Promise.all([
    db.select().from(routines).where(eq(routines.userId, userId)),
    db.select().from(routineLogs).where(and(eq(routineLogs.userId, userId), gte(routineLogs.date, weekStart))),
  ])
  const byId = new Map(rows.map((r) => [r.id, r]))
  return logs.some((l) => {
    const r = byId.get(l.routineId)
    return r ? routineIsDone(r, l.count) : false
  })
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
    const tz = prof.timezone ?? 'America/Sao_Paulo'
    const today = todayInTz(tz)
    const dates = await visitDates(db, userId)
    const yesterday = addDays(today, -1)

    // aposta automática: entra na semana nova se ainda não marcou rotina nenhuma nela
    const week = weekStartOf(today)
    const betWeeks = prof.routineBetWeeks ?? []
    if (prof.routineBetAuto && !betWeeks.includes(week) && !(await hasRoutineDoneSince(db, userId, week))) {
      await db
        .update(profile)
        .set({ routineBetWeeks: [...betWeeks, week] })
        .where(eq(profile.userId, userId))
    }

    if (dates.has(today)) {
      const [row] = await db.select().from(dailyVisits).where(and(eq(dailyVisits.userId, userId), eq(dailyVisits.date, today))).limit(1)
      return jsonResponse({ isNew: false, streak: row?.streak ?? streakEndingAt(dates, today), points: 0, chest: false })
    }

    dates.add(today)
    const streak = streakEndingAt(dates, today)
    const [inserted] = await db
      .insert(dailyVisits)
      .values({ userId, date: today, streak, points: POINTS.visit })
      .onConflictDoNothing()
      .returning()
    if (!inserted) return jsonResponse({ isNew: false, streak, points: 0, chest: false })

    let chest = false
    if (streak % STREAK_CHEST_EVERY === 0) {
      const [c2] = await db
        .insert(chests)
        .values({ userId, source: `streak${STREAK_CHEST_EVERY}:${today}`, rarity: 'rare' })
        .onConflictDoNothing()
        .returning()
      chest = !!c2
    }

    // quebrou o streak por um dia só (ontem) — dá pra salvar com poção
    let brokenStreak = 0
    if (!dates.has(yesterday)) brokenStreak = streakEndingAt(dates, addDays(today, -2))
    const potions = brokenStreak > 0 ? await potionsAvailable(db, userId) : 0

    return jsonResponse({ isNew: true, streak, points: POINTS.visit, chest, brokenStreak, potions })
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
    const tz = prof?.timezone ?? 'America/Sao_Paulo'
    const today = todayInTz(tz)
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date >= today || date < addDays(today, -BACKFILL_DAYS)) {
      return jsonResponse({ error: `a poção só funciona nos últimos ${BACKFILL_DAYS} dias (antes de hoje)` }, { status: 400 })
    }
    if ((await potionsAvailable(db, userId)) < 1) return jsonResponse({ error: 'você não tem poção' }, { status: 400 })
    const [row] = await db.insert(rescuedDays).values({ userId, date }).onConflictDoNothing().returning()
    if (!row) return jsonResponse({ error: 'esse dia já foi salvo' }, { status: 409 })

    // o streak de hoje pode ter mudado (dia do buraco foi preenchido)
    const dates = await visitDates(db, userId)
    if (dates.has(today)) {
      await db
        .update(dailyVisits)
        .set({ streak: streakEndingAt(dates, today) })
        .where(and(eq(dailyVisits.userId, userId), eq(dailyVisits.date, today)))
    }
    return jsonResponse({ ok: true, potions: await potionsAvailable(db, userId), streak: streakEndingAt(dates, today) })
  } catch (err) {
    console.error('potion error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

// ---------- aposta das rotinas ----------

app.post('/api/routine-bet', async (c) => {
  const { db, res } = await auth(c)
  if (res instanceof Response) return res
  const userId = res.user.id
  try {
    const body = (await c.req.json()) as { week?: 'current' | 'next'; on?: boolean; auto?: boolean }
    const prof = await loadProfile(db, userId)
    if (!prof) return jsonResponse({ error: 'perfil não encontrado' }, { status: 404 })
    const today = todayInTz(prof.timezone ?? 'America/Sao_Paulo')
    const current = weekStartOf(today)
    const next = addDays(current, 7)
    let weeks = new Set(prof.routineBetWeeks ?? [])
    let auto = prof.routineBetAuto

    if (typeof body.auto === 'boolean') {
      auto = body.auto
      if (auto) {
        weeks.add(next)
        if (!(await hasRoutineDoneSince(db, userId, current))) weeks.add(current)
      } else {
        weeks.delete(next)
      }
    } else if (body.week === 'current') {
      if (!body.on) return jsonResponse({ error: 'aposta feita vale até o fim da semana — dá pra desligar a da próxima' }, { status: 409 })
      if (await hasRoutineDoneSince(db, userId, current)) {
        return jsonResponse({ error: 'você já marcou rotina essa semana — a aposta começa na próxima' }, { status: 409 })
      }
      weeks.add(current)
    } else if (body.week === 'next') {
      if (body.on) weeks.add(next)
      else weeks.delete(next)
    } else {
      return jsonResponse({ error: 'informe week (current|next) ou auto' }, { status: 400 })
    }

    // só guarda as últimas semanas que importam (as antigas já foram pagas e não mudam mais de valor —
    // mas o cálculo precisa delas, então guarda até 2 anos)
    const cutoff = addDays(current, -730)
    weeks = new Set([...weeks].filter((w) => w >= cutoff))
    await db
      .update(profile)
      .set({ routineBetWeeks: [...weeks].sort(), routineBetAuto: auto })
      .where(eq(profile.userId, userId))
    return jsonResponse({ current: weeks.has(current), next: weeks.has(next), auto })
  } catch (err) {
    console.error('routine bet error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

app.get('/api/routine-bet', async (c) => {
  const { db, res } = await auth(c)
  if (res instanceof Response) return res
  const prof = await loadProfile(db, res.user.id)
  const today = todayInTz(prof?.timezone ?? 'America/Sao_Paulo')
  const current = weekStartOf(today)
  const weeks = new Set(prof?.routineBetWeeks ?? [])
  const canJoinCurrent = !weeks.has(current) && !(await hasRoutineDoneSince(db, res.user.id, current))
  return jsonResponse({ current: weeks.has(current), next: weeks.has(addDays(current, 7)), auto: prof?.routineBetAuto ?? false, canJoinCurrent })
})

// ---------- missões e baús ----------

async function missionStates(db: Db, userId: number, ctx: PointsContext): Promise<MissionState[]> {
  const [[memberships]] = await Promise.all([db.select({ value: count() }).from(communityMembers).where(eq(communityMembers.userId, userId))])
  const w = ctx.points.week
  const starterDone: Record<string, boolean> = {
    first_med: ctx.counts.medications > 0,
    first_routine: ctx.counts.routines > 0,
    avatar: ctx.counts.hasAvatar,
    join_community: (memberships?.value ?? 0) > 0,
    first_post: ctx.counts.posts > 0,
  }
  const starterCount = Object.values(starterDone).filter(Boolean).length

  const starter = STARTER_MISSIONS.map((m) => {
    const source = `m:${m.key}`
    const progress = m.key === 'all_starter' ? starterCount : starterDone[m.key] ? 1 : 0
    return { ...m, progress: Math.min(progress, m.target), hidden: false, claimed: ctx.chestSources.has(source), source }
  })

  const isSunday = weekdayOf(ctx.today) === 0
  const weekly = WEEKLY_MISSIONS.map((m) => {
    const source = `w:${w.weekStart}:${m.key}`
    let progress = 0
    let target = m.target
    let hidden = false
    if (m.key === 'w_daylog') progress = w.dayLogDays
    if (m.key === 'w_routines') {
      progress = w.routineDays
      hidden = ctx.counts.routines === 0
    }
    if (m.key === 'w_meds') {
      // só no domingo dá pra saber se a semana inteira foi certinha
      progress = isSunday && w.medsAllOnTrack ? 1 : 0
      hidden = w.meds.length === 0
    }
    if (m.key === 'w_workout') {
      target = Math.max(1, w.workoutGoal)
      progress = w.workoutsDone
      hidden = w.workoutGoal === 0
    }
    if (m.key === 'w_social') progress = w.socialWeekActions
    return { ...m, target, progress: Math.min(progress, target), hidden, claimed: ctx.chestSources.has(source), source }
  })

  return [...starter, ...weekly]
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

app.get('/api/missions', async (c) => {
  const { db, res } = await auth(c)
  if (res instanceof Response) return res
  try {
    const ctx = await loadPointsContext(db, res.user.id)
    const [missions, chestRows] = await Promise.all([
      missionStates(db, res.user.id, ctx),
      db.select().from(chests).where(eq(chests.userId, res.user.id)),
    ])
    chestRows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return jsonResponse({
      missions,
      chests: chestRows.slice(0, 30).map(toChestView),
      potions: ctx.points.potions,
      streak: ctx.points.visitStreak,
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
    const mission = (await missionStates(db, res.user.id, ctx)).find((m) => m.key === key)
    if (!mission || mission.hidden) return jsonResponse({ error: 'missão não existe' }, { status: 404 })
    if (mission.claimed) return jsonResponse({ error: 'você já pegou esse baú' }, { status: 409 })
    if (mission.progress < mission.target) return jsonResponse({ error: 'missão ainda não completa' }, { status: 400 })
    const [row] = await db.insert(chests).values({ userId: res.user.id, source: mission.source, rarity: mission.rarity }).onConflictDoNothing().returning()
    if (!row) return jsonResponse({ error: 'você já pegou esse baú' }, { status: 409 })
    return jsonResponse(toChestView(row), { status: 201 })
  } catch (err) {
    console.error('claim error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
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
