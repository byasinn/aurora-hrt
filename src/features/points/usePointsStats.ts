import { useDoseLogs } from '../../api/doses'
import { useMoodEntries } from '../../api/moods'
import { useProfile } from '../../api/profile'
import { useRoutines, useRoutineLogs } from '../../api/routines'
import { useWorkoutLogs } from '../../api/workouts'
import { useMySocialStats } from '../../api/social'
import { currentStreak, type PointsStats } from '../../lib/collectiblesEngine'
import { todayStr, daysBetween } from '../../lib/dateUtils'
import type { WorkoutExerciseLog } from '../../../shared/types'

export function usePointsStats(): PointsStats {
  const { data: doseLogs = [] } = useDoseLogs()
  const { data: moods = [] } = useMoodEntries()
  const { data: profile } = useProfile()
  const { data: routines = [] } = useRoutines()
  const { data: routineLogs = [] } = useRoutineLogs()
  const { data: workoutLogs = [] } = useWorkoutLogs()
  const { data: socialStats } = useMySocialStats()

  const today = todayStr()
  const takenDates = new Set(
    doseLogs.filter((l) => l.status === 'taken').map((l) => new Date(l.scheduledFor).toISOString().slice(0, 10)),
  )
  const moodDates = new Set(moods.map((m) => m.date))

  const routineById = new Map(routines.map((r) => [r.id, r]))
  const sfwRoutineCompletions = routineLogs.filter((l) => {
    const routine = routineById.get(l.routineId)
    if (!routine) return false
    return routine.type === 'checkbox' ? l.count > 0 : routine.targetCount != null && l.count >= routine.targetCount
  }).length

  const workoutDates = new Set(workoutLogs.map((l) => l.date))
  const exercisesWithWeight = new Set<string>()
  let totalWorkoutVolume = 0
  for (const log of workoutLogs) {
    const setLogs = (log.setLogs as WorkoutExerciseLog[] | null) ?? []
    for (const exercise of setLogs) {
      for (const set of exercise.sets) {
        if (!set.done || set.weight == null) continue
        exercisesWithWeight.add(exercise.name)
        totalWorkoutVolume += set.weight * (set.reps ?? 0)
      }
    }
  }
  const personalRecordsCount = exercisesWithWeight.size

  const postsCount = (socialStats?.postsCount ?? 0) + (socialStats?.communityPostsCount ?? 0)
  const commentsGivenCount = (socialStats?.commentsCount ?? 0) + (socialStats?.communityCommentsCount ?? 0)
  const interactionsCount = postsCount + commentsGivenCount

  const brilho =
    postsCount * 10 +
    commentsGivenCount * 3 +
    sfwRoutineCompletions * 5 +
    workoutLogs.length * 5 +
    moods.length * 2 +
    takenDates.size * 1

  return {
    brilho: Math.round(brilho),
    postsCount,
    commentsGivenCount,
    totalMoodEntries: moods.length,
    totalDosesTaken: doseLogs.filter((l) => l.status === 'taken').length,
    currentMoodStreakDays: currentStreak(moodDates, today),
    currentDoseStreakDays: currentStreak(takenDates, today),
    daysSinceTransitionStart: profile?.transitionStartDate ? daysBetween(profile.transitionStartDate, today) : null,
    sfwRoutineCompletions,
    interactionsCount,
    workoutSessionsCount: workoutLogs.length,
    currentWorkoutStreakDays: currentStreak(workoutDates, today),
    personalRecordsCount,
    totalWorkoutVolume,
  }
}
