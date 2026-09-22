import { eq, count } from 'drizzle-orm'
import {
  doseLogs,
  moodEntries,
  routines,
  routineLogs,
  workoutLogs,
  posts,
  postComments,
  communityPosts,
  communityPostComments,
  profile,
} from '../../shared/schema'
import { currentStreak, type PointsStats } from '../../src/lib/collectiblesEngine'
import type { WorkoutExerciseLog } from '../../shared/types'
import type { getDb } from './db'

/** Data local (YYYY-MM-DD) no fuso salvo do perfil — o Worker roda em UTC, então "hoje" aqui só
 * bate com o "hoje" que o app mostra no celular se passar pelo fuso certo (padrão America/Sao_Paulo). */
function todayInTz(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date())
}

function daysBetween(fromStr: string, toStr: string): number {
  const from = new Date(`${fromStr}T00:00:00`)
  const to = new Date(`${toStr}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

/**
 * Recalcula os pontos/estatísticas de um usuário direto do banco — a mesma fórmula de
 * `src/features/points/usePointsStats.ts`, só que aqui é a fonte da verdade pra validar
 * desbloqueio de título/conquista/troféu no servidor (o cliente nunca é confiável pra isso:
 * ver worker/routes/unlocked-titles.ts, unlocked-trophies.ts, achievements.ts).
 */
export async function computeServerPointsStats(db: ReturnType<typeof getDb>, userId: number): Promise<PointsStats> {
  const [doseRows, moodRows, routineRows, routineLogRows, workoutLogRows, postsCountRows, commentsCountRows, communityPostsCountRows, communityCommentsCountRows, profileRows] =
    await Promise.all([
      db.select().from(doseLogs).where(eq(doseLogs.userId, userId)),
      db.select().from(moodEntries).where(eq(moodEntries.userId, userId)),
      db.select().from(routines).where(eq(routines.userId, userId)),
      db.select().from(routineLogs).where(eq(routineLogs.userId, userId)),
      db.select().from(workoutLogs).where(eq(workoutLogs.userId, userId)),
      db.select({ value: count() }).from(posts).where(eq(posts.userId, userId)),
      db.select({ value: count() }).from(postComments).where(eq(postComments.userId, userId)),
      db.select({ value: count() }).from(communityPosts).where(eq(communityPosts.userId, userId)),
      db.select({ value: count() }).from(communityPostComments).where(eq(communityPostComments.userId, userId)),
      db.select({ timezone: profile.timezone, transitionStartDate: profile.transitionStartDate }).from(profile).where(eq(profile.userId, userId)).limit(1),
    ])

  const timezone = profileRows[0]?.timezone ?? 'America/Sao_Paulo'
  const today = todayInTz(timezone)

  const takenDates = new Set(
    doseRows.filter((l) => l.status === 'taken').map((l) => new Date(l.scheduledFor).toISOString().slice(0, 10)),
  )
  const moodDates = new Set(moodRows.map((m) => m.date))

  const routineById = new Map(routineRows.map((r) => [r.id, r]))
  const sfwRoutineCompletions = routineLogRows.filter((l) => {
    const routine = routineById.get(l.routineId)
    if (!routine) return false
    return routine.type === 'checkbox' ? l.count > 0 : routine.targetCount != null && l.count >= routine.targetCount
  }).length

  const workoutDates = new Set(workoutLogRows.map((l) => l.date))
  const exercisesWithWeight = new Set<string>()
  let totalWorkoutVolume = 0
  for (const log of workoutLogRows) {
    const setLogs = (log.setLogs as WorkoutExerciseLog[] | null) ?? []
    for (const exercise of setLogs) {
      for (const set of exercise.sets) {
        if (!set.done || set.weight == null) continue
        exercisesWithWeight.add(exercise.name)
        totalWorkoutVolume += set.weight * (set.reps ?? 0)
      }
    }
  }

  const postsCount = (postsCountRows[0]?.value ?? 0) + (communityPostsCountRows[0]?.value ?? 0)
  const commentsGivenCount = (commentsCountRows[0]?.value ?? 0) + (communityCommentsCountRows[0]?.value ?? 0)
  const interactionsCount = postsCount + commentsGivenCount

  const brilho =
    postsCount * 10 +
    commentsGivenCount * 3 +
    sfwRoutineCompletions * 5 +
    workoutLogRows.length * 5 +
    moodRows.length * 2 +
    takenDates.size * 1

  const transitionStartDate = profileRows[0]?.transitionStartDate ?? null

  return {
    brilho: Math.round(brilho),
    postsCount,
    commentsGivenCount,
    totalMoodEntries: moodRows.length,
    totalDosesTaken: doseRows.filter((l) => l.status === 'taken').length,
    currentMoodStreakDays: currentStreak(moodDates, today),
    currentDoseStreakDays: currentStreak(takenDates, today),
    daysSinceTransitionStart: transitionStartDate ? daysBetween(transitionStartDate, today) : null,
    sfwRoutineCompletions,
    interactionsCount,
    workoutSessionsCount: workoutLogRows.length,
    currentWorkoutStreakDays: currentStreak(workoutDates, today),
    personalRecordsCount: exercisesWithWeight.size,
    totalWorkoutVolume,
  }
}
