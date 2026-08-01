export interface PunishmentTemplate {
  key: string
  title: string
  icon: string
  durationOptions: number[] // horas
}

export const PUNISHMENT_TEMPLATES: PunishmentTemplate[] = [
  { key: 'chastity', title: 'Castidade', icon: '🔒', durationOptions: [4, 12, 24, 48] },
  { key: 'oral_training', title: 'Treino oral', icon: '👄', durationOptions: [1, 2, 4] },
  { key: 'anal_training', title: 'Treino anal', icon: '🍑', durationOptions: [1, 2, 4, 8] },
  { key: 'corner_time', title: 'De castigo', icon: '⏳', durationOptions: [1, 2, 4] },
  { key: 'lines', title: 'Linhas escritas', icon: '✍️', durationOptions: [1] },
]

export function formatDuration(hours: number): string {
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  return `${days} dia${days === 1 ? '' : 's'}`
}
