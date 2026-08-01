import { useEffect, useRef, useState } from 'react'
import { Pencil, Trash2, Check, Minus, Plus, Play, Pause } from 'lucide-react'
import { Card } from '../../components/ui'
import {
  useRoutineLogs,
  useCreateRoutineLog,
  useUpdateRoutineLog,
  useDeleteRoutine,
} from '../../api/routines'
import { todayStr } from '../../lib/dateUtils'
import { getRoutineIcon } from '../../lib/routineIcons'
import type { Routine } from '../../../shared/types'

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function RoutineRow({
  routine,
  onEdit,
  compact,
}: {
  routine: Routine
  onEdit?: () => void
  compact?: boolean
}) {
  const today = todayStr()
  const { data: logs } = useRoutineLogs({ from: today, to: today })
  const createLog = useCreateRoutineLog()
  const updateLog = useUpdateRoutineLog()
  const deleteRoutine = useDeleteRoutine()

  const todayLog = logs?.find((l) => l.routineId === routine.id)
  const count = todayLog?.count ?? 0
  const isCheckbox = routine.type === 'checkbox'
  const isTimer = routine.type === 'timer'
  const done = isCheckbox ? count > 0 : routine.targetCount != null && count >= routine.targetCount

  const [running, setRunning] = useState(false)
  const [, forceTick] = useState(0)
  const sessionStartRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => forceTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  const sessionSeconds =
    running && sessionStartRef.current ? Math.floor((Date.now() - sessionStartRef.current) / 1000) : 0
  const displaySeconds = count + sessionSeconds

  function setCount(next: number) {
    const clamped = Math.max(0, next)
    if (todayLog) {
      updateLog.mutate({ id: todayLog.id, count: clamped })
    } else {
      createLog.mutate({ routineId: routine.id, date: today, count: clamped })
    }
  }

  function toggleTimer() {
    if (running) {
      const elapsed = sessionStartRef.current ? Math.floor((Date.now() - sessionStartRef.current) / 1000) : 0
      sessionStartRef.current = null
      setRunning(false)
      if (elapsed > 0) setCount(count + elapsed)
    } else {
      sessionStartRef.current = Date.now()
      setRunning(true)
    }
  }

  function handleDelete() {
    if (confirm(`Excluir a rotina "${routine.name}"?`)) {
      deleteRoutine.mutate(routine.id)
    }
  }

  const RoutineIcon = getRoutineIcon(routine.icon)

  return (
    <Card className={'flex items-center gap-3 ' + (done ? 'border-[var(--accent)]' : '')}>
      {RoutineIcon ? (
        <RoutineIcon size={20} className="shrink-0 text-[var(--accent)]" />
      ) : (
        <span className="text-xl">{routine.icon}</span>
      )}
      <div className="flex-1">
        <p className="font-medium text-[var(--text)]">{routine.name}</p>
        {!isCheckbox && (
          <p className="text-xs text-[var(--text-muted)]">
            {isTimer ? formatDuration(displaySeconds) : count}/
            {isTimer ? formatDuration(routine.targetCount ?? 0) : routine.targetCount}
          </p>
        )}
      </div>

      {isCheckbox ? (
        <button
          onClick={() => setCount(done ? 0 : 1)}
          className={
            'flex h-9 w-9 items-center justify-center rounded-full border transition ' +
            (done
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
              : 'border-[var(--border)] text-[var(--text-muted)]')
          }
        >
          <Check size={16} />
        </button>
      ) : isTimer ? (
        <button
          onClick={toggleTimer}
          className={
            'flex h-9 w-9 items-center justify-center rounded-full border transition ' +
            (running
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
              : 'border-[var(--border)] text-[var(--text-muted)]')
          }
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCount(count - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)]"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={() => setCount(count + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--accent)] text-[var(--accent)]"
          >
            <Plus size={14} />
          </button>
        </div>
      )}

      {!compact && onEdit && (
        <button onClick={onEdit} className="text-[var(--text-muted)]">
          <Pencil size={14} />
        </button>
      )}
      {!compact && (
        <button onClick={handleDelete} className="text-[var(--text-muted)]">
          <Trash2 size={14} />
        </button>
      )}
    </Card>
  )
}
