import { useEffect } from 'react'
import { Card, ScreenTitle } from '../../components/ui'
import { useUnlockedAchievements, useUnlockAchievement } from '../../api/achievements'
import { useDoseLogs } from '../../api/doses'
import { useMoodEntries } from '../../api/moods'
import { useCreateMessage } from '../../api/messages'
import { ACHIEVEMENTS } from '../../lib/achievementsEngine'
import { computeWeeklySummary } from '../../lib/insights'
import { useAchievementStats } from './useAchievementStats'

export default function AchievementsScreen() {
  const { data: unlocked = [] } = useUnlockedAchievements()
  const unlockAchievement = useUnlockAchievement()
  const createMessage = useCreateMessage()
  const stats = useAchievementStats()
  const { data: doseLogs = [] } = useDoseLogs()
  const { data: moodEntries = [] } = useMoodEntries()
  const weekly = computeWeeklySummary({ doseLogs, moodEntries })

  const unlockedKeys = new Set(unlocked.map((u) => u.achievementKey))

  useEffect(() => {
    for (const ach of ACHIEVEMENTS) {
      if (!unlockedKeys.has(ach.key) && ach.isMet(stats)) {
        unlockAchievement.mutate(ach.key)
        createMessage.mutate({
          icon: ach.icon,
          title: 'Novo troféu!',
          body: `${ach.title} — ${ach.description}`,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stats.totalDosesTaken,
    stats.currentDoseStreakDays,
    stats.totalMoodEntries,
    stats.currentMoodStreakDays,
    stats.daysSinceTransitionStart,
  ])

  return (
    <div className="space-y-5">
      <ScreenTitle>Troféus</ScreenTitle>

      <Card className="space-y-2">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Resumo da semana</h2>
        <p className="text-sm text-[var(--text)]">
          {weekly.dosesTracked > 0
            ? `${weekly.dosesTaken}/${weekly.dosesTracked} doses em dia`
            : 'Nenhuma dose registrada ainda'}
          {' · '}
          {weekly.moodCheckIns} check-in{weekly.moodCheckIns === 1 ? '' : 's'} de humor
        </p>
        {(weekly.avgEnergy !== null || weekly.avgLibido !== null) && (
          <p className="text-xs text-[var(--text-muted)]">
            {weekly.avgEnergy !== null && `Energia média: ${weekly.avgEnergy.toFixed(1)}/10`}
            {weekly.avgEnergy !== null && weekly.avgLibido !== null && ' · '}
            {weekly.avgLibido !== null && `Libido média: ${weekly.avgLibido.toFixed(1)}/10`}
          </p>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Estatísticas</h2>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-2xl font-semibold flag-gradient-text">{stats.currentDoseStreakDays}</p>
            <p className="text-xs text-[var(--text-muted)]">dias em sequência</p>
          </div>
          <div>
            <p className="text-2xl font-semibold flag-gradient-text">{stats.totalDosesTaken}</p>
            <p className="text-xs text-[var(--text-muted)]">doses registradas</p>
          </div>
          <div>
            <p className="text-2xl font-semibold flag-gradient-text">{stats.currentMoodStreakDays}</p>
            <p className="text-xs text-[var(--text-muted)]">dias de check-in</p>
          </div>
          <div>
            <p className="text-2xl font-semibold flag-gradient-text">
              {stats.daysSinceTransitionStart ?? '–'}
            </p>
            <p className="text-xs text-[var(--text-muted)]">dias de jornada</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {ACHIEVEMENTS.map((ach) => {
          const isUnlocked = unlockedKeys.has(ach.key)
          return (
            <Card
              key={ach.key}
              className={
                'flex flex-col items-center gap-1 text-center transition ' +
                (isUnlocked ? '' : 'opacity-35 grayscale')
              }
            >
              <span className="text-3xl">{ach.icon}</span>
              <span className="text-xs font-medium text-[var(--text)]">{ach.title}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{ach.description}</span>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
