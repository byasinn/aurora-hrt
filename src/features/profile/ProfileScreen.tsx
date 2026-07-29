import { useEffect, useState } from 'react'
import { Button, Card, ScreenTitle } from '../../components/ui'
import { useProfile, useUpdateProfile } from '../../api/profile'
import { useDoseLogs } from '../../api/doses'
import { useMoodEntries } from '../../api/moods'
import { useUnlockedAchievements, useUnlockAchievement } from '../../api/achievements'
import { useThemeStore, applyTheme } from '../../lib/themeStore'
import { ACHIEVEMENTS, currentStreak, type AchievementStats } from '../../lib/achievementsEngine'
import { todayStr, daysBetween } from '../../lib/dateUtils'
import { enablePushNotifications, getNotificationPermissionState } from '../../lib/notifications'

const ACCENTS = ['#7fd4e8', '#f7a8c4', '#c9a2ff', '#9ae6b4', '#ffd166']

function useAchievementStats(): AchievementStats {
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

export default function ProfileScreen() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const { data: unlocked = [] } = useUnlockedAchievements()
  const unlockAchievement = useUnlockAchievement()
  const stats = useAchievementStats()
  const theme = useThemeStore()

  const [displayName, setDisplayName] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [transitionStartDate, setTransitionStartDate] = useState('')
  const [pushState, setPushState] = useState<string>('')

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.displayName)
    setPronouns(profile.pronouns)
    setTransitionStartDate(profile.transitionStartDate ?? '')
  }, [profile])

  useEffect(() => {
    getNotificationPermissionState().then(setPushState)
  }, [])

  const unlockedKeys = new Set(unlocked.map((u) => u.achievementKey))
  useEffect(() => {
    for (const ach of ACHIEVEMENTS) {
      if (!unlockedKeys.has(ach.key) && ach.isMet(stats)) {
        unlockAchievement.mutate(ach.key)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.totalDosesTaken, stats.currentDoseStreakDays, stats.totalMoodEntries, stats.currentMoodStreakDays, stats.daysSinceTransitionStart])

  function saveProfile() {
    updateProfile.mutate({ displayName, pronouns, transitionStartDate: transitionStartDate || null })
  }

  async function handleEnablePush() {
    const res = await enablePushNotifications()
    setPushState(res.ok ? 'granted' : (res.reason ?? 'erro'))
  }

  return (
    <div className="space-y-5">
      <ScreenTitle>Perfil</ScreenTitle>

      <Card className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Nome</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Pronomes</label>
          <input
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            placeholder="ela/dela, ele/dele, elu/delu…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Início da transição</label>
          <input
            type="date"
            value={transitionStartDate}
            onChange={(e) => setTransitionStartDate(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <Button className="w-full" onClick={saveProfile} disabled={updateProfile.isPending}>
          Salvar perfil
        </Button>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Estatísticas</h2>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-2xl font-semibold text-[var(--accent)]">{stats.currentDoseStreakDays}</p>
            <p className="text-xs text-[var(--text-muted)]">dias em sequência</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-[var(--accent)]">{stats.totalDosesTaken}</p>
            <p className="text-xs text-[var(--text-muted)]">doses registradas</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Troféus</h2>
        <div className="grid grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = unlockedKeys.has(ach.key)
            return (
              <div
                key={ach.key}
                title={ach.description}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center ${
                  isUnlocked ? 'border-[var(--accent)]' : 'border-[var(--border)] opacity-30'
                }`}
              >
                <span className="text-2xl">{ach.icon}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{ach.title}</span>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Notificações</h2>
        <p className="text-xs text-[var(--text-muted)]">Status: {pushState || 'verificando…'}</p>
        <Button variant="secondary" className="w-full" onClick={handleEnablePush}>
          Ativar lembretes por notificação
        </Button>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Aparência</h2>
        <div className="flex gap-2">
          <Button
            variant={theme.mode === 'dark' ? 'primary' : 'secondary'}
            className="flex-1"
            onClick={() => {
              theme.setMode('dark')
              applyTheme('dark', theme.accent)
            }}
          >
            Escuro
          </Button>
          <Button
            variant={theme.mode === 'light' ? 'primary' : 'secondary'}
            className="flex-1"
            onClick={() => {
              theme.setMode('light')
              applyTheme('light', theme.accent)
            }}
          >
            Claro
          </Button>
        </div>
        <div className="flex gap-2">
          {ACCENTS.map((c) => (
            <button
              key={c}
              onClick={() => {
                theme.setAccent(c)
                applyTheme(theme.mode, c)
              }}
              className="h-8 w-8 rounded-full border-2"
              style={{ background: c, borderColor: theme.accent === c ? '#fff' : 'transparent' }}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}
