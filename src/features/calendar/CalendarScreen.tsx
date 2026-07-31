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
import { useRoutines, useRoutineLogs } from '../../api/routines'
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
  const { data: routines } = useRoutines()
  const { data: routineLogs } = useRoutineLogs({ from, to })
  const medById = new Map((meds ?? []).map((m) => [m.id, m]))
  const routineById = new Map((routines ?? []).map((r) => [r.id, r]))

  const dayInfo = useMemo(() => {
    const map = new Map<string, { taken: number; missed: number; mood: boolean; routine: boolean }>()
    for (const log of doseLogs ?? []) {
      const key = new Date(log.scheduledFor).toISOString().slice(0, 10)
      const entry = map.get(key) ?? { taken: 0, missed: 0, mood: false, routine: false }
      if (log.status === 'taken') entry.taken += 1
      else if (log.status === 'missed' || log.status === 'skipped') entry.missed += 1
      map.set(key, entry)
    }
    for (const m of moods ?? []) {
      const entry = map.get(m.date) ?? { taken: 0, missed: 0, mood: false, routine: false }
      entry.mood = true
      map.set(m.date, entry)
    }
    for (const log of routineLogs ?? []) {
      const routine = routineById.get(log.routineId)
      if (!routine) continue
      const done = routine.type === 'checkbox' ? log.count > 0 : routine.targetCount != null && log.count >= routine.targetCount
      if (!done) continue
      const entry = map.get(log.date) ?? { taken: 0, missed: 0, mood: false, routine: false }
      entry.routine = true
      map.set(log.date, entry)
    }
    return map
  }, [doseLogs, moods, routineLogs, routineById])

  const selectedLogs = (doseLogs ?? []).filter(
    (l) => selected && new Date(l.scheduledFor).toISOString().slice(0, 10) === selected,
  )
  const selectedMood = (moods ?? []).find((m) => m.date === selected)
  const selectedRoutineLogs = (routineLogs ?? []).filter((l) => {
    if (l.date !== selected) return false
    const routine = routineById.get(l.routineId)
    if (!routine) return false
    return routine.type === 'checkbox' ? l.count > 0 : routine.targetCount != null && l.count >= routine.targetCount
  })

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

            const colors: string[] = []
            if (info?.taken) colors.push('#10b981')
            if (info?.missed) colors.push('#ef4444')
            if (info?.mood) colors.push('var(--accent-2)')
            if (info?.routine) colors.push('#f59e0b')
            const background =
              colors.length === 0
                ? undefined
                : colors.length === 1
                  ? colors[0]
                  : `linear-gradient(135deg, ${colors.join(', ')})`

            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                style={background ? { background } : undefined}
                className={clsx(
                  'flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-medium transition',
                  !inMonth && 'opacity-30',
                  colors.length > 0 ? 'text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]' : 'text-[var(--text)]',
                  !background && 'hover:bg-[var(--surface-2)]',
                  selected === key && 'ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--surface)]',
                  !selected && isToday(day) && 'border border-[var(--accent)]',
                )}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3 text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> dose tomada
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" /> pulada/perdida
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[var(--accent-2)]" /> check-in de humor
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> rotinas concluídas
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: 'linear-gradient(135deg, #10b981, var(--accent-2))' }} /> combinação = gradiente
          </span>
        </div>
      </Card>

      {selected && (
        <Card className="space-y-2">
          <p className="text-sm font-medium text-[var(--text)]">{formatDateBR(selected)}</p>
          {selectedLogs.length === 0 && !selectedMood && selectedRoutineLogs.length === 0 && (
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
          {selectedRoutineLogs.map((log) => (
            <p key={log.id} className="text-sm text-[var(--text)]">
              {routineById.get(log.routineId)?.icon} {routineById.get(log.routineId)?.name}
            </p>
          ))}
        </Card>
      )}

      {!doseLogs?.length && !moods?.length && !routineLogs?.length && (
        <EmptyState>Ainda não há registros neste mês.</EmptyState>
      )}
    </div>
  )
}
