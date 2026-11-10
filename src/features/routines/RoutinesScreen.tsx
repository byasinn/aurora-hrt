import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Target } from '../../components/icons'
import { Card, EmptyState, ScreenTitle } from '../../components/ui'
import { useRoutines } from '../../api/routines'
import { usePoints } from '../../api/points'
import { MAX_ROUTINES, POINTS } from '../../../shared/points'
import { showToast } from '../../lib/toast'
import RoutineForm from './RoutineForm'
import RoutineRow from './RoutineRow'
import type { Routine } from '../../../shared/types'

/** Explica a Semana Perfeita e mostra como estão as rotinas nela essa semana. */
function PerfectWeekCard() {
  const { data: points } = usePoints()
  const list = points?.week.perfectWeek ?? []
  return (
    <Card className="space-y-2">
      <div className="flex items-start gap-3">
        <Target size={26} className="mt-0.5 shrink-0 text-[var(--accent)]" />
        <div className="min-w-0 flex-1">
          <p className="font-bold">Semana Perfeita</p>
          <p className="text-xs text-[var(--text-muted)]">
            Cada rotina pode valer +{POINTS.routinePerDay} por dia, ou juntar tudo pro domingo com +
            {Math.round((POINTS.perfectWeekMultiplier - 1) * 100)}% se for feita em todos os dias. Escolha no lápis de cada rotina — vale a partir da
            semana seguinte.
          </p>
        </div>
      </div>
      {list.map((r) => (
        <div key={r.routineId} className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-3 py-2 text-sm">
          <span className="min-w-0 truncate">{r.name}</span>
          <span className={r.onTrack ? 'font-bold text-[var(--accent)]' : 'text-[var(--text-muted)]'}>
            {r.done}/{r.due} {r.onTrack ? 'no caminho' : '· não paga essa semana'}
          </span>
        </div>
      ))}
    </Card>
  )
}

export default function RoutinesScreen() {
  const location = useLocation()
  const { data: routines, isLoading } = useRoutines()
  const [formState, setFormState] = useState<'closed' | 'create' | Routine>(
    (location.state as { create?: boolean } | null)?.create ? 'create' : 'closed',
  )

  const active = routines?.filter((r) => r.active) ?? []
  const atLimit = (routines?.length ?? 0) >= MAX_ROUTINES

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ScreenTitle>Rotinas</ScreenTitle>
        <button
          onClick={() => {
            if (atLimit && formState === 'closed') return showToast(`Você já tem ${MAX_ROUTINES} rotinas — apague uma pra criar outra.`)
            setFormState(formState === 'closed' ? 'create' : 'closed')
          }}
          aria-label="Nova rotina"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]"
        >
          <Plus size={18} />
        </button>
      </div>
      <p className="-mt-3 text-xs text-[var(--text-muted)]">
        Água, exercício, dieta, sono — o que você quiser acompanhar além das doses. ({routines?.length ?? 0}/{MAX_ROUTINES})
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

      {active.length > 0 && formState === 'closed' && <PerfectWeekCard />}
    </div>
  )
}
