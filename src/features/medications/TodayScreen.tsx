import { useState } from 'react'
import { Button, Card, EmptyState, ScreenTitle } from '../../components/ui'
import { useToday, useLogDose, useUpdateDoseLog, type TodayItem } from '../../api/doses'
import { formatTime } from '../../lib/dateUtils'
import MedicationForm from './MedicationForm'
import clsx from 'clsx'

const ROUTE_LABELS: Record<string, string> = {
  oral: 'Oral',
  injection: 'Injeção',
  patch: 'Adesivo',
  gel: 'Gel',
  other: 'Outro',
}

const STATUS_STYLES: Record<TodayItem['status'], string> = {
  pending: 'border-[var(--border)]',
  taken: 'border-emerald-500/50',
  skipped: 'border-[var(--border)] opacity-60',
  missed: 'border-red-500/50',
}

function DoseCard({ item }: { item: TodayItem }) {
  const logDose = useLogDose()
  const updateDose = useUpdateDoseLog()
  const pending = logDose.isPending || updateDose.isPending

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

  function markSkipped() {
    if (item.doseLogId) {
      updateDose.mutate({ id: item.doseLogId, status: 'skipped' })
    } else {
      logDose.mutate({
        medicationId: item.medication.id,
        scheduledFor: new Date(item.scheduledFor),
        status: 'skipped',
      })
    }
  }

  return (
    <Card className={clsx('flex items-center justify-between gap-3', STATUS_STYLES[item.status])}>
      <div>
        <p className="font-medium text-[var(--text)]">{item.medication.name}</p>
        <p className="text-xs text-[var(--text-muted)]">
          {item.medication.doseAmount}
          {item.medication.doseUnit} · {ROUTE_LABELS[item.medication.route] ?? item.medication.route} ·{' '}
          {formatTime(item.scheduledFor)}
          {item.status === 'missed' && ' · atrasado'}
        </p>
      </div>
      {item.status === 'taken' ? (
        <span className="text-sm text-emerald-400">✓ Tomado</span>
      ) : item.status === 'skipped' ? (
        <span className="text-sm text-[var(--text-muted)]">Pulado</span>
      ) : (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={markSkipped} disabled={pending}>
            Pular
          </Button>
          <Button onClick={markTaken} disabled={pending}>
            Tomei
          </Button>
        </div>
      )}
    </Card>
  )
}

export default function TodayScreen() {
  const { data, isLoading, isError } = useToday()
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <ScreenTitle>Hoje</ScreenTitle>
        <Button variant="secondary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Fechar' : '+ Medicamento'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-4">
          <MedicationForm onDone={() => setShowForm(false)} />
        </div>
      )}

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {isError && (
        <EmptyState>
          Não foi possível carregar os dados de hoje. Verifique a conexão com o backend.
        </EmptyState>
      )}

      {data && data.items.length === 0 && !showForm && (
        <EmptyState>Nenhum medicamento cadastrado ainda. Toque em "+ Medicamento" para começar.</EmptyState>
      )}

      <div className="space-y-3">
        {data?.items.map((item) => (
          <DoseCard key={`${item.medication.id}-${item.scheduledFor}`} item={item} />
        ))}
      </div>
    </div>
  )
}
