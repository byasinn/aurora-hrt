import { and, eq, count, gte, isNull } from 'drizzle-orm'
import {
  doseLogs,
  moodEntries,
  routines,
  routineLogs,
  workoutLogs,
  workoutPrograms,
  workoutDays,
  posts,
  postComments,
  postLikes,
  communityPosts,
  communityPostComments,
  communityPostLikes,
  dayNotes,
  medications,
  profile,
  dailyVisits,
  chests,
  rescuedDays,
  forumTopics,
  forumReplies,
  forumTopicLikes,
} from '../../shared/schema'
import { currentStreak, transitionYearsBonus, type PointsStats } from '../../src/lib/collectiblesEngine'
import { dateStrInTimezone } from '../../shared/scheduling'
import { computeActivityPoints, computeStreak, workoutWeeklyGoal, type PointsResult } from '../../shared/points'
import type { ChestContents } from '../../shared/missions'
import type { getDb } from './db'

type Db = ReturnType<typeof getDb>

/** Data local (YYYY-MM-DD) no fuso salvo do perfil — o Worker roda em UTC, então "hoje" aqui só
 * bate com o "hoje" que o app mostra no celular se passar pelo fuso certo (padrão America/Sao_Paulo). */
export function todayInTz(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date())
}

function daysBetween(fromStr: string, toStr: string): number {
  const from = new Date(`${fromStr}T00:00:00`)
  const to = new Date(`${toStr}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

export interface PointsSummary extends PointsResult {
  total: number
  legacy: number
  transitionBonus: number
  visits: number
  chests: number
  since: string
  visitStreak: number
  restDaysLeft: number
  potions: number
  unopenedChests: number
}

export interface PointsContext {
  stats: PointsStats
  points: PointsSummary
  timeZone: string
  today: string
  /** pra checar missões sem consultar de novo */
  counts: { medications: number; routines: number; posts: number; hasAvatar: boolean }
  visitDates: Set<string>
  chestSources: Set<string>
  rescued: Set<string>
}

/**
 * Recalcula Brilho e estatísticas de um usuário direto do banco. É a fonte da verdade: lojinha,
 * títulos, conquistas e troféus validam por aqui (o cliente nunca é confiável pra isso), e o app
 * mostra o que /api/points devolve.
 */
export async function loadPointsContext(db: Db, userId: number): Promise<PointsContext> {
  const [[prof]] = await Promise.all([db.select().from(profile).where(eq(profile.userId, userId)).limit(1)])
  const timeZone = prof?.timezone ?? 'America/Sao_Paulo'
  const today = todayInTz(timeZone)

  const [
    doseRows,
    moodRows,
    routineRows,
    routineLogRows,
    workoutLogRows,
    postsCountRows,
    commentsCountRows,
    communityPostsCountRows,
    communityCommentsCountRows,
    medRows,
    programRows,
    dayRows,
    visitRows,
    chestRows,
    rescuedRows,
  ] = await Promise.all([
    db.select().from(doseLogs).where(eq(doseLogs.userId, userId)),
    db.select().from(moodEntries).where(eq(moodEntries.userId, userId)),
    db.select().from(routines).where(eq(routines.userId, userId)),
    db.select().from(routineLogs).where(eq(routineLogs.userId, userId)),
    db.select().from(workoutLogs).where(eq(workoutLogs.userId, userId)),
    db.select({ value: count() }).from(posts).where(eq(posts.userId, userId)),
    db.select({ value: count() }).from(postComments).where(eq(postComments.userId, userId)),
    db.select({ value: count() }).from(communityPosts).where(eq(communityPosts.userId, userId)),
    db.select({ value: count() }).from(communityPostComments).where(eq(communityPostComments.userId, userId)),
    db.select().from(medications).where(eq(medications.userId, userId)),
    db.select().from(workoutPrograms).where(eq(workoutPrograms.userId, userId)),
    db
      .select({ programId: workoutDays.programId, daysOfWeek: workoutDays.daysOfWeek })
      .from(workoutDays)
      .innerJoin(workoutPrograms, eq(workoutDays.programId, workoutPrograms.id))
      .where(eq(workoutPrograms.userId, userId)),
    db.select().from(dailyVisits).where(eq(dailyVisits.userId, userId)),
    db.select().from(chests).where(eq(chests.userId, userId)),
    db.select({ date: rescuedDays.date }).from(rescuedDays).where(eq(rescuedDays.userId, userId)),
  ])

  const postsCount = (postsCountRows[0]?.value ?? 0) + (communityPostsCountRows[0]?.value ?? 0)
  const commentsGivenCount = (commentsCountRows[0]?.value ?? 0) + (communityCommentsCountRows[0]?.value ?? 0)

  // histórico preenchido retroativamente (backfilled) não conta — senão quem cadastra "tomo desde 2019"
  // ganha milhares de pontos e um streak de anos no primeiro dia
  const realTakenLogs = doseRows.filter((l) => l.status === 'taken' && !l.backfilled)
  const takenDates = new Set(realTakenLogs.map((l) => dateStrInTimezone(new Date(l.scheduledFor), timeZone)))
  const moodDates = new Set(moodRows.map((m) => m.date))
  const routineById = new Map(routineRows.map((r) => [r.id, r]))
  const sfwRoutineCompletions = routineLogRows.filter((l) => {
    const routine = routineById.get(l.routineId)
    if (!routine) return false
    return routine.type === 'checkbox' ? l.count > 0 : routine.targetCount != null && l.count >= routine.targetCount
  }).length

  // Troca pro Brilho v2: na primeira vez, congela o que a fórmula antiga dava (sem o bônus de anos de
  // transição, que continua somado à parte) e passa a contar pelas regras novas a partir de hoje.
  let since = prof?.pointsV2Since ?? null
  let legacy = prof?.legacyBrilho ?? 0
  if (prof && !since) {
    legacy = Math.round(
      postsCount * 10 + commentsGivenCount * 3 + sfwRoutineCompletions * 5 + workoutLogRows.length * 5 + moodRows.length * 2 + takenDates.size * 1,
    )
    since = today
    await db
      .update(profile)
      .set({ pointsV2Since: since, legacyBrilho: legacy })
      .where(and(eq(profile.userId, userId), isNull(profile.pointsV2Since)))
  }
  since ??= today
  const sinceStart = new Date(`${since}T00:00:00.000Z`)
  sinceStart.setUTCDate(sinceStart.getUTCDate() - 1) // folga de fuso

  const [noteRows, likeRows, communityLikeRows, commentRows, communityCommentRows, postRows, communityPostRows, forumTopicRows, forumReplyRows, forumLikeRows] = await Promise.all([
    db.select().from(dayNotes).where(and(eq(dayNotes.userId, userId), gte(dayNotes.date, since))),
    db.select({ createdAt: postLikes.createdAt }).from(postLikes).where(and(eq(postLikes.userId, userId), gte(postLikes.createdAt, sinceStart))),
    db
      .select({ createdAt: communityPostLikes.createdAt })
      .from(communityPostLikes)
      .where(and(eq(communityPostLikes.userId, userId), gte(communityPostLikes.createdAt, sinceStart))),
    db.select({ createdAt: postComments.createdAt }).from(postComments).where(and(eq(postComments.userId, userId), gte(postComments.createdAt, sinceStart))),
    db
      .select({ createdAt: communityPostComments.createdAt })
      .from(communityPostComments)
      .where(and(eq(communityPostComments.userId, userId), gte(communityPostComments.createdAt, sinceStart))),
    db
      .select({ createdAt: posts.createdAt })
      .from(posts)
      .where(and(eq(posts.userId, userId), gte(posts.createdAt, sinceStart), isNull(posts.repostOfKind))),
    db
      .select({ createdAt: communityPosts.createdAt })
      .from(communityPosts)
      .where(and(eq(communityPosts.userId, userId), gte(communityPosts.createdAt, sinceStart))),
    // Comunidade (fórum): tópico vale como post, resposta como comentário, curtida como curtida
    db.select({ createdAt: forumTopics.createdAt }).from(forumTopics).where(and(eq(forumTopics.userId, userId), gte(forumTopics.createdAt, sinceStart))),
    db.select({ createdAt: forumReplies.createdAt }).from(forumReplies).where(and(eq(forumReplies.userId, userId), gte(forumReplies.createdAt, sinceStart))),
    db
      .select({ createdAt: forumTopicLikes.createdAt })
      .from(forumTopicLikes)
      .where(and(eq(forumTopicLikes.userId, userId), gte(forumTopicLikes.createdAt, sinceStart))),
  ])

  const rescued = new Set(rescuedRows.map((r) => r.date))
  const programs = programRows.map((p) => ({ active: p.active, days: dayRows.filter((d) => d.programId === p.id) }))

  const result = computeActivityPoints({
    today,
    since,
    timeZone,
    rescued,
    moods: moodRows,
    dayNotes: noteRows,
    routines: routineRows,
    routineLogs: routineLogRows,
    workoutGoal: workoutWeeklyGoal(programs),
    workoutLogs: workoutLogRows,
    meds: medRows.map((m) => ({ ...m, preferredTimes: m.preferredTimes ?? [] })),
    doseLogs: doseRows,
    social: [
      ...likeRows.map((r) => ({ kind: 'like' as const, createdAt: r.createdAt })),
      ...communityLikeRows.map((r) => ({ kind: 'like' as const, createdAt: r.createdAt })),
      ...commentRows.map((r) => ({ kind: 'comment' as const, createdAt: r.createdAt })),
      ...communityCommentRows.map((r) => ({ kind: 'comment' as const, createdAt: r.createdAt })),
      ...postRows.map((r) => ({ kind: 'post' as const, createdAt: r.createdAt })),
      ...communityPostRows.map((r) => ({ kind: 'post' as const, createdAt: r.createdAt })),
      ...forumTopicRows.map((r) => ({ kind: 'post' as const, createdAt: r.createdAt })),
      ...forumReplyRows.map((r) => ({ kind: 'comment' as const, createdAt: r.createdAt })),
      ...forumLikeRows.map((r) => ({ kind: 'like' as const, createdAt: r.createdAt })),
    ],
  })

  const transitionStartDate = prof?.transitionStartDate ?? null
  const daysSinceTransitionStart = transitionStartDate ? daysBetween(transitionStartDate, today) : null
  const transitionBonus = transitionYearsBonus(daysSinceTransitionStart)
  const visits = visitRows.reduce((s, v) => s + v.points, 0)
  const openedChests = chestRows.filter((c) => c.openedAt && c.contents)
  const chestBrilho = openedChests.reduce((s, c) => s + ((c.contents as ChestContents).brilho ?? 0), 0)
  const potionsEarned = openedChests.reduce((s, c) => s + ((c.contents as ChestContents).potions ?? 0), 0)
  const visitDates = new Set([...visitRows.map((v) => v.date), ...rescued])
  const streakState = computeStreak(visitDates, today)

  const total = legacy + transitionBonus + result.activity + visits + chestBrilho
  const workoutDates = new Set(workoutLogRows.map((l) => l.date))

  return {
    timeZone,
    today,
    rescued,
    chestSources: new Set(chestRows.map((c) => c.source)),
    visitDates,
    counts: { medications: medRows.length, routines: routineRows.length, posts: postsCount, hasAvatar: !!prof?.avatarUrl },
    points: {
      ...result,
      total,
      legacy,
      transitionBonus,
      visits,
      chests: chestBrilho,
      since,
      visitStreak: streakState.streak,
      restDaysLeft: streakState.restDaysLeft,
      potions: Math.max(0, potionsEarned - rescued.size),
      unopenedChests: chestRows.filter((c) => !c.openedAt).length,
    },
    stats: {
      brilho: total,
      postsCount,
      commentsGivenCount,
      totalMoodEntries: moodRows.length,
      totalDosesTaken: realTakenLogs.length,
      currentMoodStreakDays: currentStreak(moodDates, today),
      currentDoseStreakDays: currentStreak(takenDates, today),
      daysSinceTransitionStart,
      sfwRoutineCompletions,
      interactionsCount: postsCount + commentsGivenCount,
      workoutSessionsCount: workoutLogRows.length,
      currentWorkoutStreakDays: currentStreak(workoutDates, today),
      workoutGoalWeeks: result.workoutGoalWeeks,
    },
  }
}

export async function computeServerPointsStats(db: Db, userId: number): Promise<PointsStats> {
  return (await loadPointsContext(db, userId)).stats
}
