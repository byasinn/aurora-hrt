export interface PointsStats {
  brilho: number
  postsCount: number
  commentsGivenCount: number
  totalMoodEntries: number
  totalDosesTaken: number
  currentMoodStreakDays: number
  currentDoseStreakDays: number
  daysSinceTransitionStart: number | null
  sfwRoutineCompletions: number
  interactionsCount: number
  workoutSessionsCount: number
  currentWorkoutStreakDays: number
  personalRecordsCount: number
  totalWorkoutVolume: number
}

export interface CollectibleDef {
  key: string
  title: string
  description: string
  icon: string
  isMet: (s: PointsStats) => boolean
}

export const ACHIEVEMENTS_SFW: CollectibleDef[] = [
  {
    key: 'first_post',
    title: 'Primeira Postagem',
    description: 'Você compartilhou seu primeiro post.',
    icon: 'camera',
    isMet: (s) => s.postsCount >= 1,
  },
  {
    key: 'checkin_streak_7',
    title: '7 Dias de Check-in Seguidos',
    description: '7 dias seguidos registrando como você está.',
    icon: 'calendar_check',
    isMet: (s) => s.currentMoodStreakDays >= 7,
  },
  {
    key: 'routines_30',
    title: '30 Rotinas Diárias Concluídas',
    description: 'Você concluiu 30 rotinas.',
    icon: 'check_circle',
    isMet: (s) => s.sfwRoutineCompletions >= 30,
  },
  {
    key: 'helped_10',
    title: 'Ajudou 10 Meninas',
    description: '10 comentários de apoio em posts de outras pessoas.',
    icon: 'hand_heart',
    isMet: (s) => s.commentsGivenCount >= 10,
  },
  {
    key: 'mood_month',
    title: 'Completou 1 Mês de Registro de Humor',
    description: '30 registros de humor.',
    icon: 'moon',
    isMet: (s) => s.totalMoodEntries >= 30,
  },
  {
    key: 'comments_50',
    title: 'Fez 50 Comentários Úteis',
    description: '50 comentários feitos na comunidade.',
    icon: 'message_circle',
    isMet: (s) => s.commentsGivenCount >= 50,
  },
  {
    key: 'streak_14',
    title: 'Manteve Streak de 14 Dias',
    description: '14 dias seguidos de consistência.',
    icon: 'flame',
    isMet: (s) => Math.max(s.currentDoseStreakDays, s.currentMoodStreakDays) >= 14,
  },
  {
    key: 'first_workout',
    title: 'Primeiro Treino',
    description: 'Você completou seu primeiro treino.',
    icon: 'dumbbell',
    isMet: (s) => s.workoutSessionsCount >= 1,
  },
  {
    key: 'workout_streak_7',
    title: 'Semana de Ferro',
    description: '7 dias seguidos treinando.',
    icon: 'flame',
    isMet: (s) => s.currentWorkoutStreakDays >= 7,
  },
  {
    key: 'first_pr',
    title: 'Recorde Pessoal',
    description: 'Bateu seu primeiro recorde de carga.',
    icon: 'trending_up',
    isMet: (s) => s.personalRecordsCount >= 1,
  },
  {
    key: 'workouts_50',
    title: '50 Treinos Concluídos',
    description: '50 sessões de treino registradas.',
    icon: 'dumbbell',
    isMet: (s) => s.workoutSessionsCount >= 50,
  },
]

export const TROPHIES_SFW: CollectibleDef[] = [
  {
    key: 'trophy_consistency',
    title: 'Troféu da Constância',
    description: '90 dias de registro diário.',
    icon: 'gauge',
    isMet: (s) => Math.max(s.currentDoseStreakDays, s.currentMoodStreakDays) >= 90,
  },
  {
    key: 'trophy_community',
    title: 'Troféu da Comunidade',
    description: '100 interações positivas.',
    icon: 'handshake',
    isMet: (s) => s.interactionsCount >= 100,
  },
  {
    key: 'trophy_evolution',
    title: 'Troféu da Evolução',
    description: '6 meses de tracking de HRT.',
    icon: 'sunrise',
    isMet: (s) => (s.daysSinceTransitionStart ?? -1) >= 180,
  },
  {
    key: 'trophy_iron',
    title: 'Troféu de Ferro',
    description: '100 treinos concluídos.',
    icon: 'dumbbell',
    isMet: (s) => s.workoutSessionsCount >= 100,
  },
  {
    key: 'trophy_unstoppable',
    title: 'Troféu da Imparável',
    description: '30 dias seguidos de treino.',
    icon: 'flame',
    isMet: (s) => s.currentWorkoutStreakDays >= 30,
  },
]

/** Conta dias consecutivos (terminando hoje ou ontem) presentes em `dateStrs` (formato YYYY-MM-DD). */
export function currentStreak(dateStrs: Set<string>, todayStr: string): number {
  let streak = 0
  const cursor = new Date(`${todayStr}T00:00:00`)
  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    if (!dateStrs.has(key)) {
      if (streak === 0 && key === todayStr) {
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
