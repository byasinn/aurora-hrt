import { useWorkoutLogs } from '../../api/workouts'
import { currentStreak } from '../../lib/collectiblesEngine'
import { todayStr, daysBetween } from '../../lib/dateUtils'
import type { WorkoutExerciseLog } from '../../../shared/types'

export interface ExercisePR {
  name: string
  maxWeight: number
  repsAtMax: number
}

export interface WorkoutStats {
  sessionsCount: number
  currentStreakDays: number
  thisWeekSessionsCount: number
  totalVolume: number
  prsByExercise: Map<string, ExercisePR>
  weeklySessionCounts: number[] // índice 0 = essa semana, 7 = 7 semanas atrás
}

export function useWorkoutStats(): WorkoutStats {
  const { data: logs = [] } = useWorkoutLogs()
  const today = todayStr()

  const dateStrs = new Set(logs.map((l) => l.date))
  const currentStreakDays = currentStreak(dateStrs, today)

  let totalVolume = 0
  const prsByExercise = new Map<string, ExercisePR>()
  const weeklySessionCounts = new Array(8).fill(0) as number[]
  let thisWeekSessionsCount = 0

  for (const log of logs) {
    const weeksAgo = Math.floor(daysBetween(log.date, today) / 7)
    if (weeksAgo >= 0 && weeksAgo < weeklySessionCounts.length) weeklySessionCounts[weeksAgo] += 1
    if (weeksAgo === 0) thisWeekSessionsCount += 1

    const setLogs = (log.setLogs as WorkoutExerciseLog[] | null) ?? []
    for (const exercise of setLogs) {
      for (const set of exercise.sets) {
        if (!set.done || set.weight == null) continue
        totalVolume += set.weight * (set.reps ?? 0)
        const current = prsByExercise.get(exercise.name)
        if (!current || set.weight > current.maxWeight) {
          prsByExercise.set(exercise.name, { name: exercise.name, maxWeight: set.weight, repsAtMax: set.reps ?? 0 })
        }
      }
    }
  }

  return {
    sessionsCount: logs.length,
    currentStreakDays,
    thisWeekSessionsCount,
    totalVolume,
    prsByExercise,
    weeklySessionCounts,
  }
}
