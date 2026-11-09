import { useMoodEntries } from '../../api/moods'
import { useDoseLogs } from '../../api/doses'
import { useProfile } from '../../api/profile'
import { useRoutines, useRoutineLogs } from '../../api/routines'
import { useWorkoutLogs } from '../../api/workouts'
import { useMySocialStats } from '../../api/social'
import { usePoints } from '../../api/points'
import { currentStreak, type PointsStats } from '../../lib/collectiblesEngine'
import { todayStr, daysBetween, localDateStr } from '../../lib/dateUtils'

/** Estatísticas pra conquistas/troféus (calculadas aqui, o servidor confere ao desbloquear). O Brilho
 * vem pronto do servidor (/api/points) — as regras de semana completa, aposta e poção ficam só lá. */
export function usePointsStats(): PointsStats {
  const { data: doseLogs = [] } = useDoseLogs()
  const { data: moods = [] } = useMoodEntries()
  const { data: profile } = useProfile()
  const { data: routines = [] } = useRoutines()
  const { data: routineLogs = [] } = useRoutineLogs()
  const { data: workoutLogs = [] } = useWorkoutLogs()
  const { data: socialStats } = useMySocialStats()
  const { data: points } = usePoints()

  const today = todayStr()
  // histórico preenchido retroativamente (backfilled) não conta — senão quem cadastra "tomo desde 2019"
  // ganha um streak de anos no primeiro dia
  const realTakenLogs = doseLogs.filter((l) => l.status === 'taken' && !l.backfilled)
  const takenDates = new Set(realTakenLogs.map((l) => localDateStr(new Date(l.scheduledFor))))
  const moodDates = new Set(moods.map((m) => m.date))

  const routineById = new Map(routines.map((r) => [r.id, r]))
  const sfwRoutineCompletions = routineLogs.filter((l) => {
    const routine = routineById.get(l.routineId)
    if (!routine) return false
    return routine.type === 'checkbox' ? l.count > 0 : routine.targetCount != null && l.count >= routine.targetCount
  }).length

  const workoutDates = new Set(workoutLogs.map((l) => l.date))
  const postsCount = (socialStats?.postsCount ?? 0) + (socialStats?.communityPostsCount ?? 0)
  const commentsGivenCount = (socialStats?.commentsCount ?? 0) + (socialStats?.communityCommentsCount ?? 0)

  return {
    brilho: points?.total ?? 0,
    postsCount,
    commentsGivenCount,
    totalMoodEntries: moods.length,
    totalDosesTaken: realTakenLogs.length,
    currentMoodStreakDays: currentStreak(moodDates, today),
    currentDoseStreakDays: currentStreak(takenDates, today),
    daysSinceTransitionStart: profile?.transitionStartDate ? daysBetween(profile.transitionStartDate, today) : null,
    sfwRoutineCompletions,
    interactionsCount: postsCount + commentsGivenCount,
    workoutSessionsCount: workoutLogs.length,
    currentWorkoutStreakDays: currentStreak(workoutDates, today),
    workoutGoalWeeks: points?.workoutGoalWeeks ?? 0,
  }
}
