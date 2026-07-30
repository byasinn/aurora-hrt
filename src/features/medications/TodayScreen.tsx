import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Heart, Calendar, Pill, Syringe, Bandage, Droplet, Sparkles } from 'lucide-react'
import { Button, Card, EmptyState } from '../../components/ui'
import SwipeableRow from '../../components/SwipeableRow'
import { useToday, useLogDose, useUpdateDoseLog, type TodayItem } from '../../api/doses'
import { useProfile } from '../../api/profile'
import { useDeleteMedication, useMedications } from '../../api/medications'
import { formatTime } from '../../lib/dateUtils'
import WelcomeBanner from '../../components/WelcomeBanner'
import InsightsCard from '../../components/InsightsCard'
import TipOfDayCard from '../../components/TipOfDayCard'
import MedicationForm from './MedicationForm'
import type { Medication } from '../../../shared/types'

const ROUTE_LABELS: Record<string, string> = {
  oral: 'Oral',
  injection: 'Injeção',
  patch: 'Adesivo',
  gel: 'Gel',
  other: 'Outro',
}

const ROUTE_ICONS: Record<string, typeof Pill> = {
  oral: Pill,
  injection: Syringe,
  patch: Bandage,
  gel: Droplet,
  other: Sparkles,
}

function DoseRow({ item, onEdit }: { item: TodayItem; onEdit: (medicationId: number) => void }) {
  const logDose = useLogDose()
  const updateDose = useUpdateDoseLog()
  const deleteMed = useDeleteMedication()
  const RouteIcon = ROUTE_ICONS[item.medication.route] ?? Sparkles

  function markTaken() {
    if (item.doseLogId) {
      updateDose.mutate({ id: item.doseLogId, status: 'taken', takenAt: new Date() })
    } else {
      logDose.mutate({
        medicationId: item.medication.id,
        scheduledFor: new Date(item.scheduledFor),
        status: 'taken',
        takenAt: new Date(),
      })
    }
  }

  function handleDelete() {
    if (confirm(`Excluir "${item.medication.name}"? Isso remove o medicamento e seu histórico.`)) {
      deleteMed.mutate(item.medication.id)
    }
  }

  return (
    <SwipeableRow
      onTap={item.status === 'pending' || item.status === 'missed' ? markTaken : undefined}
      onEdit={() => onEdit(item.medication.id)}
      onDelete={handleDelete}
    >
      <Card
        className={
          'flex items-center gap-3 border-l-4 ' +
          (item.status === 'missed' ? 'border-l-red-500' : 'border-l-[var(--accent)]')
        }
      >
        <RouteIcon size={22} className="text-[var(--accent)]" />
        <div className="flex-1">
          <p className="font-medium text-[var(--text)]">{item.medication.name}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {item.medication.doseAmount}
            {item.medication.doseUnit} · {ROUTE_LABELS[item.medication.route] ?? item.medication.route} ·{' '}
            {formatTime(item.scheduledFor)}
            {item.status === 'missed' && ' · atrasado'}
          </p>
        </div>
      </Card>
    </SwipeableRow>
  )
}

export default function TodayScreen() {
  const { data, isLoading, isError } = useToday()
  const { data: profile } = useProfile()
  const { data: medications } = useMedications()
  const [formState, setFormState] = useState<'closed' | 'create' | Medication>('closed')

  const pending = data?.items.filter((i) => i.status === 'pending' || i.status === 'missed') ?? []
  const done = data?.items.filter((i) => i.status === 'taken' || i.status === 'skipped') ?? []

  function openEdit(medicationId: number) {
    const med = medications?.find((m) => m.id === medicationId)
    if (med) setFormState(med)
  }

  return (
    <div>
      <WelcomeBanner />
      <TipOfDayCard />
      <InsightsCard />

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Remédios</h2>
        <button
          onClick={() => setFormState(formState === 'closed' ? 'create' : 'closed')}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]"
        >
          <Plus size={18} />
        </button>
      </div>

      {formState !== 'closed' && (
        <div className="mb-4">
          <MedicationForm
            medication={formState === 'create' ? undefined : formState}
            onDone={() => setFormState('closed')}
          />
        </div>
      )}

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {isError && (
        <EmptyState>
          Não foi possível carregar os dados de hoje. Verifique a conexão com o backend.
        </EmptyState>
      )}

      {data && data.items.length === 0 && formState === 'closed' && (
        <EmptyState>
          {profile?.notOnMedsYet
            ? 'Você ainda não começou a tomar nada — sem pressa. Quando decidir, é só tocar no + acima.'
            : 'Nenhum medicamento cadastrado ainda. Toque no + acima pra começar.'}
        </EmptyState>
      )}

      <div className="space-y-3">
        {pending.map((item) => (
          <DoseRow
            key={`${item.medication.id}-${item.scheduledFor}`}
            item={item}
            onEdit={openEdit}
          />
        ))}
      </div>

      {done.length > 0 && (
        <div className="mt-4 space-y-2 opacity-50">
          {done.map((item) => (
            <Card key={`${item.medication.id}-${item.scheduledFor}`} className="flex items-center gap-3 py-2.5">
              <span className="text-xs text-[var(--text-muted)]">
                {item.status === 'taken' ? '✓' : '–'}
              </span>
              <p className="flex-1 text-sm text-[var(--text)] line-through">{item.medication.name}</p>
              <span className="text-xs text-[var(--text-muted)]">{formatTime(item.scheduledFor)}</span>
            </Card>
          ))}
        </div>
      )}

      <Link to="/mood" className="mt-4 block">
        <Button variant="secondary" className="flex w-full items-center justify-center gap-2">
          <Heart size={16} />
          Registrar humor
        </Button>
      </Link>

      <Link to="/calendar" className="mt-2 block">
        <Button variant="ghost" className="flex w-full items-center justify-center gap-2">
          <Calendar size={16} />
          Ver calendário
        </Button>
      </Link>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-[var(--text-muted)]">Explorar</h2>
        <EmptyState>Em breve: conteúdo pra explorar por aqui.</EmptyState>
      </div>
    </div>
  )
}
