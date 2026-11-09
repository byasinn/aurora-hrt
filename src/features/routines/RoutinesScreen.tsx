import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Coins, Plus } from '../../components/icons'
import { Card, EmptyState, ScreenTitle } from '../../components/ui'
import Switch from '../../components/Switch'
import { useRoutines } from '../../api/routines'
import { usePoints, useRoutineBet, useSetRoutineBet } from '../../api/points'
import { MAX_ROUTINES, POINTS } from '../../../shared/points'
import { showToast, toastError } from '../../lib/toast'
import RoutineForm from './RoutineForm'
import RoutineRow from './RoutineRow'
import type { Routine } from '../../../shared/types'

/** Modo aposta: em vez de ganhar um pouco por dia, a semana inteira paga no domingo com +50% — mas
 * só as rotinas feitas em todos os dias previstos. Dá pra entrar na semana atual enquanto nenhuma
 * rotina foi marcada nela; aposta feita não se desfaz até a semana acabar. */
function BetCard() {
  const { data: bet } = useRoutineBet()
  const { data: points } = usePoints()
  const setBet = useSetRoutineBet()
  if (!bet) return null
  const onTrack = points?.week.betOnTrack ?? []

  function change(body: Parameters<typeof setBet.mutate>[0]) {
    setBet.mutate(body, { onError: (e) => toastError(e) })
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        <Coins size={26} className="mt-0.5 shrink-0 text-amber-500" />
        <div className="min-w-0 flex-1">
          <p className="font-bold">Modo aposta</p>
          <p className="text-xs text-[var(--text-muted)]">
            Normal: +{POINTS.routinePerDay} Brilho por rotina feita no dia. Apostando: nada durante a semana e, no domingo, +50% por cada
            rotina que você fez em todos os dias. Furou um dia, aquela rotina não paga.
          </p>
        </div>
      </div>
      {bet.current ? (
        <div className="rounded-xl bg-[var(--accent-soft)] p-2.5 text-sm">
          <b>Essa semana está apostada.</b>{' '}
          {onTrack.length > 0 && (
            <span className="text-[var(--text-muted)]">
              {onTrack.filter((r) => r.onTrack).length} de {onTrack.length} rotina(s) no caminho.
            </span>
          )}
        </div>
      ) : bet.canJoinCurrent ? (
        <button
          onClick={() => change({ week: 'current', on: true })}
          disabled={setBet.isPending}
          className="w-full rounded-xl border border-[var(--accent)] py-2 text-sm font-bold text-[var(--accent)]"
        >
          Apostar essa semana
        </button>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">Você já marcou rotina essa semana — dá pra apostar a partir da próxima.</p>
      )}
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>Apostar a próxima semana</span>
        <Switch checked={bet.next} onChange={(v) => change({ week: 'next', on: v })} />
      </label>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>Apostar toda semana automaticamente</span>
        <Switch checked={bet.auto} onChange={(v) => change({ auto: v })} />
      </label>
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

      {active.length > 0 && formState === 'closed' && <BetCard />}
    </div>
  )
}
