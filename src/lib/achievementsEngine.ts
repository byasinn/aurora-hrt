import type { AchievementDef } from '../../shared/types'

export interface AchievementStats {
  totalDosesTaken: number
  currentDoseStreakDays: number
  totalMoodEntries: number
  currentMoodStreakDays: number
  daysSinceTransitionStart: number | null
}

export const ACHIEVEMENTS: (AchievementDef & { isMet: (s: AchievementStats) => boolean })[] = [
  {
    key: 'first_dose',
    title: 'Primeira dose',
    description: 'Você registrou sua primeira dose.',
    icon: '💊',
    isMet: (s) => s.totalDosesTaken >= 1,
  },
  {
    key: 'dose_streak_7',
    title: 'Uma semana em dia',
    description: '7 dias seguidos com as doses em dia.',
    icon: '🔥',
    isMet: (s) => s.currentDoseStreakDays >= 7,
  },
  {
    key: 'dose_streak_30',
    title: 'Um mês de consistência',
    description: '30 dias seguidos com as doses em dia.',
    icon: '🏆',
    isMet: (s) => s.currentDoseStreakDays >= 30,
  },
  {
    key: 'doses_50',
    title: '50 doses',
    description: 'Você registrou 50 doses.',
    icon: '⭐',
    isMet: (s) => s.totalDosesTaken >= 50,
  },
  {
    key: 'doses_100',
    title: '100 doses',
    description: 'Você registrou 100 doses.',
    icon: '🌟',
    isMet: (s) => s.totalDosesTaken >= 100,
  },
  {
    key: 'first_mood',
    title: 'Primeiro check-in',
    description: 'Você registrou seu primeiro humor do dia.',
    icon: '📝',
    isMet: (s) => s.totalMoodEntries >= 1,
  },
  {
    key: 'mood_streak_7',
    title: 'Semana de autocuidado',
    description: '7 dias seguidos registrando como você está.',
    icon: '💜',
    isMet: (s) => s.currentMoodStreakDays >= 7,
  },
  {
    key: 'transition_3m',
    title: '3 meses de jornada',
    description: '3 meses desde o início da transição.',
    icon: '🌈',
    isMet: (s) => (s.daysSinceTransitionStart ?? -1) >= 90,
  },
  {
    key: 'transition_6m',
    title: '6 meses de jornada',
    description: '6 meses desde o início da transição.',
    icon: '🏳️‍⚧️',
    isMet: (s) => (s.daysSinceTransitionStart ?? -1) >= 180,
  },
  {
    key: 'transition_1y',
    title: '1 ano de jornada',
    description: '1 ano desde o início da transição.',
    icon: '🎉',
    isMet: (s) => (s.daysSinceTransitionStart ?? -1) >= 365,
  },
]

/** Conta dias consecutivos (terminando hoje ou ontem) presentes em `dateStrs` (formato YYYY-MM-DD). */
export function currentStreak(dateStrs: Set<string>, todayStr: string): number {
  let streak = 0
  const cursor = new Date(`${todayStr}T00:00:00`)
  // Se hoje ainda não tem registro, a sequência pode ter terminado ontem — começa checando hoje mesmo assim.
  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    if (!dateStrs.has(key)) {
      if (streak === 0 && key === todayStr) {
        // hoje sem registro ainda não quebra a sequência (dia em andamento)
        cursor.setDate(cursor.getDate() - 1)
        continue
      }
      break
    }
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
