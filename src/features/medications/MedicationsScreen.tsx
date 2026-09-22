import { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, Clock } from 'lucide-react'
import clsx from 'clsx'
import { Card, EmptyState, ScreenTitle } from '../../components/ui'
import { useMedications, useDeleteMedication } from '../../api/medications'
import { useDoseLogs, useUpdateDoseLog } from '../../api/doses'
import { useProfile } from '../../api/profile'
import { daysUntilNextDue } from '../../../shared/scheduling'
import { formatDateBR } from '../../lib/dateUtils'
import MedicationForm from './MedicationForm'
import type { DoseLog, DoseStatus, Medication } from '../../../shared/types'

const ROUTE_LABELS: Record<string, string> = {
  oral: 'Oral',
  injection: 'Injeção',
  patch: 'Adesivo',
  gel: 'Gel',
  other: 'Outro',
}

const STATUS_LABELS: Record<DoseStatus, string> = {
  pending: 'Pendente',
  taken: 'Tomada',
  skipped: 'Pulada',
  missed: 'Perdida',
}

function nextDueLabel(days: number | null): string {
  if (days === null) return '—'
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Amanhã'
  return `Em ${days} dias`
}

function HistoryRow({ log }: { log: DoseLog }) {
  const updateLog = useUpdateDoseLog()
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState<DoseStatus>(log.status as DoseStatus)
  const [takenAt, setTakenAt] = useState(
    log.takenAt ? new Date(log.takenAt as unknown as string).toISOString().slice(0, 16) : '',
  )

  function save() {
    updateLog.mutate({
      id: log.id,
      status,
      takenAt: status === 'taken' ? new Date(takenAt || Date.now()) : null,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as DoseStatus)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text)]"
        >
          {(Object.keys(STATUS_LABELS) as DoseStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {status === 'taken' && (
          <input
            type="datetime-local"
            value={takenAt}
            onChange={(e) => setTakenAt(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text)]"
          />
        )}
        <button onClick={save} className="text-xs font-medium text-[var(--accent)]">
          Salvar
        </button>
        <button onClick={() => setEditing(false)} className="text-xs text-[var(--text-muted)]">
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-left text-xs hover:bg-[var(--surface-2)]"
    >
      <span className="text-[var(--text-muted)]">
        {formatDateBR(new Date(log.scheduledFor as unknown as string).toISOString().slice(0, 10))}
      </span>
      <span
        className={clsx(
          'font-medium',
          log.status === 'taken' && 'text-emerald-500',
          log.status === 'missed' && 'text-red-500',
          log.status === 'skipped' && 'text-[var(--text-muted)]',
          log.status === 'pending' && 'text-[var(--text-muted)]',
        )}
      >
        {STATUS_LABELS[log.status as DoseStatus]}
      </span>
    </button>
  )
}

function MedicationHistory({ medicationId }: { medicationId: number }) {
  const { data: logs } = useDoseLogs({ medicationId })
  const sorted = [...(logs ?? [])]
    .sort((a, b) => String(b.scheduledFor).localeCompare(String(a.scheduledFor)))
    .slice(0, 15)

  if (sorted.length === 0) {
    return <p className="text-xs text-[var(--text-muted)]">Nenhum histórico ainda.</p>
  }

  return <div className="space-y-0.5">{sorted.map((log) => <HistoryRow key={log.id} log={log} />)}</div>
}

function MedicationRow({ medication, timeZone, onEdit }: { medication: Medication; timeZone: string; onEdit: () => void }) {
  const deleteMed = useDeleteMedication()
  const [historyOpen, setHistoryOpen] = useState(false)
  const days = medication.active ? daysUntilNextDue(medication, timeZone) : null

  function handleDelete() {
    if (confirm(`Excluir "${medication.name}"? Isso remove o medicamento e seu histórico.`)) {
      deleteMed.mutate(medication.id)
    }
  }

  return (
    <Card className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="font-medium text-[var(--text)]">{medication.name}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {medication.doseAmount}
            {medication.doseUnit} · {ROUTE_LABELS[medication.route] ?? medication.route}
            {!medication.active && ' · inativo'}
          </p>
        </div>
        {medication.active && (
          <span className="flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-muted)]">
            <Clock size={11} />
            {nextDueLabel(days)}
          </span>
        )}
        <button onClick={onEdit} className="text-[var(--text-muted)]">
          <Pencil size={14} />
        </button>
        <button onClick={handleDelete} className="text-[var(--text-muted)]">
          <Trash2 size={14} />
        </button>
      </div>

      <button
        onClick={() => setHistoryOpen((o) => !o)}
        className="flex w-full items-center justify-between text-xs text-[var(--text-muted)]"
      >
        Histórico de doses
        <ChevronDown size={14} className={clsx('transition', historyOpen && 'rotate-180')} />
      </button>
      {historyOpen && <MedicationHistory medicationId={medication.id} />}
    </Card>
  )
}

export default function MedicationsScreen() {
  const { data: medications, isLoading } = useMedications()
  const { data: profile } = useProfile()
  const [formState, setFormState] = useState<'closed' | 'create' | Medication>('closed')
  const timeZone = profile?.timezone ?? 'America/Sao_Paulo'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ScreenTitle>Remédios</ScreenTitle>
        <button
          onClick={() => setFormState(formState === 'closed' ? 'create' : 'closed')}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]"
        >
          <Plus size={18} />
        </button>
      </div>

      {formState !== 'closed' && (
        <MedicationForm
          medication={formState === 'create' ? undefined : formState}
          onDone={() => setFormState('closed')}
        />
      )}

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {medications?.length === 0 && formState === 'closed' && (
        <EmptyState>Nenhum medicamento ainda. Toque no + pra adicionar o primeiro.</EmptyState>
      )}

      <div className="space-y-3">
        {medications?.map((m) => (
          <MedicationRow key={m.id} medication={m} timeZone={timeZone} onEdit={() => setFormState(m)} />
        ))}
      </div>
    </div>
  )
}
