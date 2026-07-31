import { Pencil, Trash2, Check, Minus, Plus } from 'lucide-react'
import { Card } from '../../components/ui'
import {
  useRoutineLogs,
  useCreateRoutineLog,
  useUpdateRoutineLog,
  useDeleteRoutine,
} from '../../api/routines'
import { todayStr } from '../../lib/dateUtils'
import type { Routine } from '../../../shared/types'

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
  const done = isCheckbox ? count > 0 : routine.targetCount != null && count >= routine.targetCount

  function setCount(next: number) {
    const clamped = Math.max(0, next)
    if (todayLog) {
      updateLog.mutate({ id: todayLog.id, count: clamped })
    } else {
      createLog.mutate({ routineId: routine.id, date: today, count: clamped })
    }
  }

  function handleDelete() {
    if (confirm(`Excluir a rotina "${routine.name}"?`)) {
      deleteRoutine.mutate(routine.id)
    }
  }

  return (
    <Card className={'flex items-center gap-3 ' + (done ? 'border-[var(--accent)]' : '')}>
      <span className="text-xl">{routine.icon}</span>
      <div className="flex-1">
        <p className="font-medium text-[var(--text)]">{routine.name}</p>
        {!isCheckbox && (
          <p className="text-xs text-[var(--text-muted)]">
            {count}/{routine.targetCount}
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
