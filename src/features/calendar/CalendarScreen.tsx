import { Card, EmptyState, ScreenTitle } from '../../components/ui'
import { useDoseLogs } from '../../api/doses'
import { useMoodEntries } from '../../api/moods'
import { useMedications } from '../../api/medications'
import { formatDateBR, todayStr, daysBetween } from '../../lib/dateUtils'

function rangeStart(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export default function CalendarScreen() {
  const from = rangeStart(30)
  const to = todayStr()
  const { data: doseLogs } = useDoseLogs({ from: `${from}T00:00:00.000Z`, to: `${to}T23:59:59.999Z` })
  const { data: moods } = useMoodEntries({ from, to })
  const { data: meds } = useMedications()

  const medById = new Map((meds ?? []).map((m) => [m.id, m]))

  const days: string[] = []
  for (let i = 0; i <= daysBetween(from, to); i++) {
    const d = new Date(`${from}T00:00:00`)
    d.setDate(d.getDate() + i)
    days.push(d.toISOString().slice(0, 10))
  }
  days.reverse()

  const hasAnyData = (doseLogs && doseLogs.length > 0) || (moods && moods.length > 0)

  return (
    <div>
      <ScreenTitle>Histórico</ScreenTitle>
      {!hasAnyData && <EmptyState>Ainda não há registros nos últimos 30 dias.</EmptyState>}

      <div className="space-y-3">
        {days.map((dateStr) => {
          const dayLogs = (doseLogs ?? []).filter(
            (l) => new Date(l.scheduledFor).toISOString().slice(0, 10) === dateStr,
          )
          const dayMood = (moods ?? []).find((m) => m.date === dateStr)
          if (dayLogs.length === 0 && !dayMood) return null

          return (
            <Card key={dateStr}>
              <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">{formatDateBR(dateStr)}</p>
              {dayLogs.map((log) => (
                <p key={log.id} className="text-sm text-[var(--text)]">
                  {log.status === 'taken' ? '✓' : log.status === 'skipped' ? '–' : '•'}{' '}
                  {medById.get(log.medicationId)?.name ?? 'Medicamento'}
                </p>
              ))}
              {dayMood && (
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Humor registrado · energia {dayMood.energyLevel ?? '-'}/5
                </p>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
