import { useDoseLogs } from '../../api/doses'
import { useMoodEntries } from '../../api/moods'
import { useProfile } from '../../api/profile'
import { currentStreak, type AchievementStats } from '../../lib/achievementsEngine'
import { todayStr, daysBetween } from '../../lib/dateUtils'

export function useAchievementStats(): AchievementStats {
  const { data: doseLogs = [] } = useDoseLogs()
  const { data: moods = [] } = useMoodEntries()
  const { data: profile } = useProfile()

  const takenDates = new Set(
    doseLogs.filter((l) => l.status === 'taken').map((l) => new Date(l.scheduledFor).toISOString().slice(0, 10)),
  )
  const moodDates = new Set(moods.map((m) => m.date))
  const today = todayStr()

  return {
    totalDosesTaken: doseLogs.filter((l) => l.status === 'taken').length,
    currentDoseStreakDays: currentStreak(takenDates, today),
    totalMoodEntries: moods.length,
    currentMoodStreakDays: currentStreak(moodDates, today),
    daysSinceTransitionStart: profile?.transitionStartDate
      ? daysBetween(profile.transitionStartDate, today)
      : null,
  }
}
