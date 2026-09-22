export interface DurationOption {
  key: string
  label: string
  seconds: number
}

export const DURATION_OPTIONS: DurationOption[] = [
  { key: '30min', label: '30 min', seconds: 30 * 60 },
  { key: '1h', label: '1h', seconds: 60 * 60 },
  { key: '2h', label: '2h', seconds: 2 * 60 * 60 },
  { key: '4h', label: '4h', seconds: 4 * 60 * 60 },
  { key: '12h', label: '12h', seconds: 12 * 60 * 60 },
  { key: '1d', label: '1 dia', seconds: 24 * 60 * 60 },
  { key: '2d', label: '2 dias', seconds: 2 * 24 * 60 * 60 },
  { key: '4d', label: '4 dias', seconds: 4 * 24 * 60 * 60 },
  { key: '1w', label: '1 semana', seconds: 7 * 24 * 60 * 60 },
  { key: '2w', label: '2 semanas', seconds: 14 * 24 * 60 * 60 },
]

export function formatDurationSeconds(totalSeconds: number): string {
  if (totalSeconds < 3600) return `${Math.round(totalSeconds / 60)} min`
  if (totalSeconds < 86_400) {
    const hours = totalSeconds / 3600
    return `${hours % 1 === 0 ? hours : hours.toFixed(1)}h`
  }
  const days = totalSeconds / 86_400
  if (days % 7 === 0 && days >= 7) {
    const weeks = days / 7
    return `${weeks} semana${weeks === 1 ? '' : 's'}`
  }
  return `${days % 1 === 0 ? days : days.toFixed(1)} dia${days === 1 ? '' : 's'}`
}

export function formatCountdown(remainingSeconds: number): string {
  const s = Math.max(0, Math.floor(remainingSeconds))
  const days = Math.floor(s / 86_400)
  const hours = Math.floor((s % 86_400) / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  if (days > 0) return `${days}d ${hours}h ${minutes}min`
  if (hours > 0) return `${hours}h ${minutes}min`
  if (minutes > 0) return `${minutes}min ${seconds}s`
  return `${seconds}s`
}
