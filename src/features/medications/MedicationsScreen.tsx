import { useState } from 'react'
import { Button, Card, EmptyState, ScreenTitle } from '../../components/ui'
import { useMedications, useUpdateMedication, useDeleteMedication } from '../../api/medications'
import MedicationForm from './MedicationForm'
import type { Medication } from '../../../shared/types'

const ROUTE_LABELS: Record<string, string> = {
  oral: 'Oral',
  injection: 'Injeção',
  patch: 'Adesivo',
  gel: 'Gel',
  other: 'Outro',
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Todos os dias',
  every_n_days: 'A cada N dias',
  specific_days: 'Dias específicos',
}

function MedicationRow({ medication }: { medication: Medication }) {
  const updateMed = useUpdateMedication()
  const deleteMed = useDeleteMedication()
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <Card className={medication.active ? '' : 'opacity-50'}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-[var(--text)]">{medication.name}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {medication.doseAmount}
            {medication.doseUnit} · {ROUTE_LABELS[medication.route] ?? medication.route} ·{' '}
            {FREQUENCY_LABELS[medication.frequencyType] ?? medication.frequencyType} ·{' '}
            {medication.preferredTime}
          </p>
        </div>
        {!medication.active && <span className="text-xs text-[var(--text-muted)]">Inativo</span>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() =>
            updateMed.mutate({ id: medication.id, remindersEnabled: !medication.remindersEnabled })
          }
        >
          {medication.remindersEnabled ? '🔔 Lembretes ativos' : '🔕 Lembretes desativados'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => updateMed.mutate({ id: medication.id, active: !medication.active })}
        >
          {medication.active ? 'Desativar' : 'Reativar'}
        </Button>
        {confirmDelete ? (
          <>
            <Button
              variant="secondary"
              className="border-red-500 text-red-500"
              onClick={() => deleteMed.mutate(medication.id)}
            >
              Confirmar exclusão
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
            Excluir
          </Button>
        )}
      </div>
    </Card>
  )
}

export default function MedicationsScreen() {
  const { data: medications, isLoading } = useMedications()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-4">
      <div className="mb-2 flex items-center justify-between">
        <ScreenTitle>Medicamentos</ScreenTitle>
        <Button variant="secondary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Fechar' : '+ Novo'}
        </Button>
      </div>

      {showForm && <MedicationForm onDone={() => setShowForm(false)} />}

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}

      {medications && medications.length === 0 && !showForm && (
        <EmptyState>Nenhum medicamento cadastrado ainda. Toque em "+ Novo" para começar.</EmptyState>
      )}

      <div className="space-y-3">
        {medications?.map((m) => (
          <MedicationRow key={m.id} medication={m} />
        ))}
      </div>
    </div>
  )
}
