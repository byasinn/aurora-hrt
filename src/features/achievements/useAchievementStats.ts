import { useDoseLogs } from '../../api/doses'
import { useMoodEntries } from '../../api/moods'
import { useProfile } from '../../api/profile'
import { useRoutines, useRoutineLogs } from '../../api/routines'
import { useMySocialStats } from '../../api/social'
import { currentStreak, type AchievementStats } from '../../lib/achievementsEngine'
import { todayStr, daysBetween } from '../../lib/dateUtils'

export function useAchievementStats(): AchievementStats {
  const { data: doseLogs = [] } = useDoseLogs()
  const { data: moods = [] } = useMoodEntries()
  const { data: profile } = useProfile()
  const { data: routines = [] } = useRoutines()
  const { data: routineLogs = [] } = useRoutineLogs()
  const { data: socialStats } = useMySocialStats()

  const takenDates = new Set(
    doseLogs.filter((l) => l.status === 'taken').map((l) => new Date(l.scheduledFor).toISOString().slice(0, 10)),
  )
  const moodDates = new Set(moods.map((m) => m.date))
  const today = todayStr()

  const routineById = new Map(routines.map((r) => [r.id, r]))
  const completedRoutineLogs = routineLogs.filter((l) => {
    const routine = routineById.get(l.routineId)
    if (!routine) return false
    return routine.type === 'checkbox' ? l.count > 0 : routine.targetCount != null && l.count >= routine.targetCount
  })
  const routineCompletionDates = new Set(completedRoutineLogs.map((l) => l.date))

  return {
    totalDosesTaken: doseLogs.filter((l) => l.status === 'taken').length,
    currentDoseStreakDays: currentStreak(takenDates, today),
    totalMoodEntries: moods.length,
    currentMoodStreakDays: currentStreak(moodDates, today),
    daysSinceTransitionStart: profile?.transitionStartDate
      ? daysBetween(profile.transitionStartDate, today)
      : null,
    nsfwMode: profile?.nsfwMode ?? false,
    totalRoutineCompletions: completedRoutineLogs.length,
    currentRoutineStreakDays: currentStreak(routineCompletionDates, today),
    followerCount: socialStats?.followerCount ?? 0,
    postsCount: socialStats?.postsCount ?? 0,
    commentsCount: socialStats?.commentsCount ?? 0,
  }
}
