import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { EmptyState, ScreenTitle } from '../../components/ui'
import { useRoutines } from '../../api/routines'
import RoutineForm from './RoutineForm'
import RoutineRow from './RoutineRow'
import type { Routine } from '../../../shared/types'

export default function RoutinesScreen() {
  const location = useLocation()
  const { data: routines, isLoading } = useRoutines()
  const [formState, setFormState] = useState<'closed' | 'create' | Routine>(
    (location.state as { create?: boolean } | null)?.create ? 'create' : 'closed',
  )

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
