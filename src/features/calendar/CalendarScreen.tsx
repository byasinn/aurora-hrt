import { useMemo, useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  format,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'
import { Card, EmptyState, ScreenTitle } from '../../components/ui'
import { useDoseLogs } from '../../api/doses'
import { useMoodEntries } from '../../api/moods'
import { useMedications } from '../../api/medications'
import { formatDateBR } from '../../lib/dateUtils'

function toDateStr(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export default function CalendarScreen() {
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState<string | null>(null)

  const monthStart = startOfMonth(cursor)
  const monthEnd = endOfMonth(cursor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const from = toDateStr(gridStart)
  const to = toDateStr(gridEnd)
  const { data: doseLogs } = useDoseLogs({ from: `${from}T00:00:00.000Z`, to: `${to}T23:59:59.999Z` })
  const { data: moods } = useMoodEntries({ from, to })
  const { data: meds } = useMedications()
  const medById = new Map((meds ?? []).map((m) => [m.id, m]))

  const dayInfo = useMemo(() => {
    const map = new Map<string, { taken: number; missed: number; mood: boolean }>()
    for (const log of doseLogs ?? []) {
      const key = new Date(log.scheduledFor).toISOString().slice(0, 10)
      const entry = map.get(key) ?? { taken: 0, missed: 0, mood: false }
      if (log.status === 'taken') entry.taken += 1
      else if (log.status === 'missed' || log.status === 'skipped') entry.missed += 1
      map.set(key, entry)
    }
    for (const m of moods ?? []) {
      const entry = map.get(m.date) ?? { taken: 0, missed: 0, mood: false }
      entry.mood = true
      map.set(m.date, entry)
    }
    return map
  }, [doseLogs, moods])

  const selectedLogs = (doseLogs ?? []).filter(
    (l) => selected && new Date(l.scheduledFor).toISOString().slice(0, 10) === selected,
  )
  const selectedMood = (moods ?? []).find((m) => m.date === selected)

  return (
    <div className="space-y-4">
      <ScreenTitle>Histórico</ScreenTitle>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-[var(--text)]"
          >
            ‹
          </button>
          <p className="font-medium capitalize text-[var(--text)]">
            {format(cursor, 'MMMM yyyy', { locale: ptBR })}
          </p>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-[var(--text)]"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[var(--text-muted)]">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = toDateStr(day)
            const info = dayInfo.get(key)
            const inMonth = isSameMonth(day, cursor)
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={clsx(
                  'flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-xs transition',
                  !inMonth && 'opacity-30',
                  selected === key
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                    : isToday(day)
                      ? 'border border-[var(--accent)] text-[var(--text)]'
                      : 'text-[var(--text)] hover:bg-[var(--surface-2)]',
                )}
              >
                <span>{day.getDate()}</span>
                <span className="flex gap-0.5">
                  {info?.taken ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : null}
                  {info?.missed ? <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> : null}
                  {info?.mood ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-2)]" /> : null}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3 text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> dose tomada
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> pulada/perdida
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-2)]" /> check-in de humor
          </span>
        </div>
      </Card>

      {selected && (
        <Card className="space-y-2">
          <p className="text-sm font-medium text-[var(--text)]">{formatDateBR(selected)}</p>
          {selectedLogs.length === 0 && !selectedMood && (
            <p className="text-xs text-[var(--text-muted)]">Nenhum registro nesse dia.</p>
          )}
          {selectedLogs.map((log) => (
            <p key={log.id} className="text-sm text-[var(--text)]">
              {log.status === 'taken' ? '✓' : log.status === 'skipped' ? '–' : '•'}{' '}
              {medById.get(log.medicationId)?.name ?? 'Medicamento'}
            </p>
          ))}
          {selectedMood && (
            <p className="text-sm text-[var(--text-muted)]">
              Humor registrado · energia {selectedMood.energyLevel ?? '-'}/5
            </p>
          )}
        </Card>
      )}

      {!doseLogs?.length && !moods?.length && <EmptyState>Ainda não há registros neste mês.</EmptyState>}
    </div>
  )
}
