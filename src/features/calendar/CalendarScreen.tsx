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
import { Link } from 'react-router-dom'
import { Trophy, Droplet, Pencil } from 'lucide-react'
import { Card, EmptyState, ScreenTitle } from '../../components/ui'
import Switch from '../../components/Switch'
import { useDoseLogs } from '../../api/doses'
import { useMoodEntries } from '../../api/moods'
import { useMedications } from '../../api/medications'
import { useRoutines, useRoutineLogs } from '../../api/routines'
import { useCycleLogs } from '../../api/cycle'
import { useIntimateLogs } from '../../api/intimateLogs'
import { cycleStatus } from './CycleDayForm'
import { intimateDetailLines } from './IntimateDayForm'
import { useDayNotes } from '../../api/dayNotes'
import { useProfile, useUpdateProfile } from '../../api/profile'
import { predictCycle } from '../../lib/cyclePredictions'
import { formatDateBR } from '../../lib/dateUtils'
import type { CycleFlow } from '../../../shared/types'

function toDateStr(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

const FLOW_COLOR: Record<CycleFlow, string> = {
  spotting: '#fca5a5',
  light: '#f87171',
  medium: '#ef4444',
  heavy: '#b91c1c',
}

export default function CalendarScreen() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
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
  const { data: notes } = useDayNotes({ from, to })

  const cycleEnabled = !!profile?.cycleTrackingEnabled
  const intimateEnabled = !!profile?.intimateTrackingEnabled

  // janela ampla (6 meses pra trás) só quando o ciclo tá ativo, pra ter dado suficiente pra previsão
  const cyclePredictionFrom = toDateStr(subMonths(new Date(), 6))
  const { data: cycleLogs = [] } = useCycleLogs(cycleEnabled ? { from: cyclePredictionFrom } : { from: to, to: from })
  const { data: intimateLogs = [] } = useIntimateLogs(intimateEnabled ? { from, to } : { from: to, to: from })

  const medById = new Map((meds ?? []).map((m) => [m.id, m]))
  const routineById = new Map((routines ?? []).map((r) => [r.id, r]))

  const prediction = useMemo(
    () => (cycleEnabled ? predictCycle(cycleLogs, profile?.averageCycleLength ?? 28) : null),
    [cycleEnabled, cycleLogs, profile?.averageCycleLength],
  )

  const dayInfo = useMemo(() => {
    const map = new Map<string, { taken: number; missed: number; mood: boolean; routine: boolean; flow: CycleFlow | null; intimate: boolean; note: boolean }>()
    function entryFor(key: string) {
      let entry = map.get(key)
      if (!entry) {
        entry = { taken: 0, missed: 0, mood: false, routine: false, flow: null, intimate: false, note: false }
        map.set(key, entry)
      }
      return entry
    }
    for (const log of doseLogs ?? []) {
      const key = new Date(log.scheduledFor).toISOString().slice(0, 10)
      const entry = entryFor(key)
      if (log.status === 'taken') entry.taken += 1
      else if (log.status === 'missed' || log.status === 'skipped') entry.missed += 1
    }
    for (const m of moods ?? []) {
      entryFor(m.date).mood = true
    }
    for (const log of routineLogs ?? []) {
      const routine = routineById.get(log.routineId)
      if (!routine) continue
      const done = routine.type === 'checkbox' ? log.count > 0 : routine.targetCount != null && log.count >= routine.targetCount
      if (!done) continue
      entryFor(log.date).routine = true
    }
    for (const n of notes ?? []) {
      entryFor(n.date).note = true
    }
    if (cycleEnabled) {
      for (const log of cycleLogs) {
        if (log.flow) entryFor(log.date).flow = log.flow as CycleFlow
      }
    }
    if (intimateEnabled) {
      for (const log of intimateLogs) {
        entryFor(log.date).intimate = true
      }
    }
    return map
  }, [doseLogs, moods, routineLogs, routineById, notes, cycleLogs, cycleEnabled, intimateLogs, intimateEnabled])

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
  const selectedInfo = selected ? dayInfo.get(selected) : undefined
  const selectedNote = (notes ?? []).find((n) => n.date === selected)
  const selectedCycleLog = cycleLogs.find((l) => l.date === selected)
  const selectedIntimateLog = intimateLogs.find((l) => l.date === selected)
  const intimateLines = intimateDetailLines(selectedIntimateLog)

  const daysUntilNext = prediction?.nextPeriodStart
    ? Math.ceil((new Date(`${prediction.nextPeriodStart}T00:00:00`).getTime() - Date.now()) / 86_400_000)
    : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ScreenTitle>Histórico</ScreenTitle>
        <Link
          to="/pontos"
          className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--accent)]"
        >
          <Trophy size={14} /> Pontos
        </Link>
      </div>

      {cycleEnabled && (
        <Card className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--text)]">
              <Droplet size={14} className="text-red-500" /> Ciclo
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">Pausado (HRT)</span>
              <Switch checked={profile?.cyclePaused ?? false} onChange={(v) => updateProfile.mutate({ cyclePaused: v })} />
            </div>
          </div>
          {profile?.cyclePaused ? (
            <p className="text-xs text-[var(--text-muted)]">
              Previsões desativadas — seu ciclo tá marcado como instável (ex: por causa da HRT). O registro de
              fluxo continua contando pro histórico, só as previsões ficam escondidas.
            </p>
          ) : prediction?.cycleDay != null ? (
            <>
              <p className="text-sm text-[var(--text)]">
                Dia <strong>{prediction.cycleDay}</strong> do ciclo atual
              </p>
              {daysUntilNext != null && (
                <p className="text-xs text-[var(--text-muted)]">
                  {daysUntilNext > 0
                    ? `Próximo período previsto em ${daysUntilNext} dia${daysUntilNext === 1 ? '' : 's'}`
                    : daysUntilNext === 0
                      ? 'Próximo período previsto pra hoje'
                      : 'Período previsto já passou — se ainda não veio, isso é normal, ciclos variam'}
                </p>
              )}
              {prediction.fertileWindowStart && prediction.fertileWindowEnd && (
                <p className="text-[11px] text-[var(--text-muted)]">
                  Janela fértil estimada: {format(new Date(`${prediction.fertileWindowStart}T00:00:00`), 'd/MM')} –{' '}
                  {format(new Date(`${prediction.fertileWindowEnd}T00:00:00`), 'd/MM')}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">Registre seu período em "Registrar dia" pra começar a ver previsões.</p>
          )}
        </Card>
      )}

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

            const isFertile =
              cycleEnabled &&
              !profile?.cyclePaused &&
              prediction?.fertileWindowStart &&
              prediction?.fertileWindowEnd &&
              key >= prediction.fertileWindowStart &&
              key <= prediction.fertileWindowEnd
            const isPredictedPeriod = cycleEnabled && !profile?.cyclePaused && prediction?.nextPeriodStart === key

            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                style={background ? { background } : undefined}
                className={clsx(
                  'relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-medium transition',
                  !inMonth && 'opacity-30',
                  colors.length > 0 ? 'text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]' : 'text-[var(--text)]',
                  !background && isFertile && 'bg-[var(--accent-2)]/15',
                  !background && !isFertile && 'hover:bg-[var(--surface-2)]',
                  selected === key && 'ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--surface)]',
                  !selected && isToday(day) && 'border border-[var(--accent)]',
                  isPredictedPeriod && !info?.flow && 'border border-dashed border-red-400',
                )}
              >
                {day.getDate()}
                {(info?.flow || info?.intimate || info?.note) && (
                  <span className="absolute bottom-1 flex gap-0.5">
                    {info?.flow && <span className="h-1 w-1 rounded-full" style={{ background: FLOW_COLOR[info.flow] }} />}
                    {info?.intimate && <span className="h-1 w-1 rounded-full bg-[var(--accent-3)]" />}
                    {info?.note && <span className="h-1 w-1 rounded-full bg-[var(--text-muted)]" />}
                  </span>
                )}
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
          {cycleEnabled && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> fluxo registrado
            </span>
          )}
          {intimateEnabled && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-3)]" /> atividade íntima
            </span>
          )}
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]" /> anotação
          </span>
        </div>
      </Card>

      {selected && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--text)]">{formatDateBR(selected)}</p>
            <Link
              to={`/dia?date=${selected}`}
              className="flex items-center gap-1 text-xs font-medium text-[var(--accent)]"
            >
              <Pencil size={12} /> Editar registro do dia
            </Link>
          </div>

          {selectedLogs.length === 0 &&
            !selectedMood &&
            selectedRoutineLogs.length === 0 &&
            !selectedInfo?.flow &&
            !selectedInfo?.intimate &&
            !selectedNote && <p className="text-xs text-[var(--text-muted)]">Nenhum registro nesse dia.</p>}

          {selectedLogs.map((log) => (
            <p key={log.id} className="text-sm text-[var(--text)]">
              {log.status === 'taken' ? '✓' : log.status === 'skipped' ? '–' : '•'}{' '}
              {medById.get(log.medicationId)?.name ?? 'Medicamento'}
            </p>
          ))}
          {selectedMood && (
            <p className="text-sm text-[var(--text-muted)]">
              Humor registrado · energia {selectedMood.energyLevel ?? '-'}/10
            </p>
          )}
          {selectedRoutineLogs.map((log) => (
            <p key={log.id} className="text-sm text-[var(--text)]">
              {routineById.get(log.routineId)?.icon} {routineById.get(log.routineId)?.name}
            </p>
          ))}
          {selectedInfo?.flow && selectedCycleLog && (
            <p className="text-sm text-[var(--text-muted)]">
              {cycleStatus(selectedCycleLog.flow, (selectedCycleLog.symptoms as string[] | null) ?? []).status}
            </p>
          )}
          {intimateLines.map((line, i) => (
            <p key={i} className="text-sm text-[var(--text-muted)]">
              {line}
            </p>
          ))}
          {selectedNote && <p className="text-sm text-[var(--text-muted)]">Anotação: {selectedNote.note}</p>}
        </Card>
      )}

      {!doseLogs?.length && !moods?.length && !routineLogs?.length && !cycleLogs.length && !intimateLogs.length && (
        <EmptyState>Ainda não há registros neste mês.</EmptyState>
      )}
    </div>
  )
}
