import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, Minus } from 'lucide-react'
import { Card, EmptyState, ScreenTitle } from '../../components/ui'
import {
  useRoutines,
  useDeleteRoutine,
  useRoutineLogs,
  useCreateRoutineLog,
  useUpdateRoutineLog,
} from '../../api/routines'
import { todayStr } from '../../lib/dateUtils'
import RoutineForm from './RoutineForm'
import type { Routine } from '../../../shared/types'

function RoutineRow({ routine, onEdit }: { routine: Routine; onEdit: () => void }) {
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

      <button onClick={onEdit} className="text-[var(--text-muted)]">
        <Pencil size={14} />
      </button>
      <button onClick={handleDelete} className="text-[var(--text-muted)]">
        <Trash2 size={14} />
      </button>
    </Card>
  )
}

export default function RoutinesScreen() {
  const { data: routines, isLoading } = useRoutines()
  const [formState, setFormState] = useState<'closed' | 'create' | Routine>('closed')

  const active = routines?.filter((r) => r.active) ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ScreenTitle>Rotinas</ScreenTitle>
        <button
          onClick={() => setFormState(formState === 'closed' ? 'create' : 'closed')}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]"
        >
          <Plus size={18} />
        </button>
      </div>
      <p className="-mt-3 text-xs text-[var(--text-muted)]">
        Água, exercício, dieta, sono — o que você quiser acompanhar além das doses.
      </p>

      {formState !== 'closed' && (
        <RoutineForm
          routine={formState === 'create' ? undefined : formState}
          onDone={() => setFormState('closed')}
        />
      )}

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {active.length === 0 && formState === 'closed' && (
        <EmptyState>Nenhuma rotina ainda. Toque no + pra criar a primeira.</EmptyState>
      )}

      <div className="space-y-3">
        {active.map((r) => (
          <RoutineRow key={r.id} routine={r} onEdit={() => setFormState(r)} />
        ))}
      </div>
    </div>
  )
}
