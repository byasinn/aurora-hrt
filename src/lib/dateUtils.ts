/** Data local (YYYY-MM-DD) no fuso do dispositivo — nunca use toISOString() aqui, que é UTC e
 * vira "amanhã" pra qualquer horário depois de ~21h no Brasil (UTC-3). */
export function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayStr(): string {
  return localDateStr(new Date())
}

export function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function daysBetween(fromStr: string, toStr: string): number {
  const from = new Date(`${fromStr}T00:00:00`)
  const to = new Date(`${toStr}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export function weekdayLabel(day: number): string {
  return WEEKDAY_LABELS[day] ?? ''
}

/** "há quanto tempo" curto (agora/Xmin/Xh/Xd/data). Telas novas devem importar daqui — já existem
 * 3 cópias quase idênticas espalhadas (FeedItemCard, CommentThread, InboxScreen); consolidar essas
 * é limpeza pra depois, não repita a duplicação em código novo. */
export function timeAgo(iso: string | Date): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString('pt-BR')
}
