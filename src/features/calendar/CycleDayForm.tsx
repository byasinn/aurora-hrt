import { useState } from 'react'
import clsx from 'clsx'
import { Button } from '../../components/ui'
import { useCycleLogs, useSaveCycleLog } from '../../api/cycle'
import { toastError } from '../../lib/toast'
import type { CycleFlow } from '../../../shared/types'

const FLOW_OPTIONS: { value: CycleFlow; label: string }[] = [
  { value: 'spotting', label: 'Escape' },
  { value: 'light', label: 'Leve' },
  { value: 'medium', label: 'Médio' },
  { value: 'heavy', label: 'Intenso' },
]

const CYCLE_SYMPTOM_SUGGESTIONS = [
  'Cólica',
  'Dor de cabeça',
  'Inchaço',
  'Sensibilidade nos seios',
  'Alteração de humor',
  'Fadiga',
  'Acne',
  'Dor nas costas',
  'Náusea',
  'Desejo alimentar',
]

export function cycleStatus(flow: string | null | undefined, symptoms: string[]): { filled: boolean; status: string } {
  const flowLabel = flow ? FLOW_OPTIONS.find((f) => f.value === flow)?.label : null
  const parts = [flowLabel ? `Fluxo: ${flowLabel}` : null, symptoms.length > 0 ? `Sintomas: ${symptoms.join(', ')}` : null].filter(
    Boolean,
  )
  return { filled: parts.length > 0, status: parts.length > 0 ? parts.join(' · ') : 'Em aberto' }
}

export default function CycleDayForm({ date }: { date: string }) {
  const { data: logs = [] } = useCycleLogs({ from: date, to: date })
  const saveLog = useSaveCycleLog()
  const existing = logs.find((l) => l.date === date)
  const [symptomsDraft, setSymptomsDraft] = useState<string[] | null>(null)
  const activeSymptoms = symptomsDraft ?? ((existing?.symptoms as string[] | null) ?? [])

  function setFlow(flow: CycleFlow | null) {
    saveLog.mutate(
      { date, flow, symptoms: activeSymptoms, notes: existing?.notes ?? null },
      { onError: (err) => toastError(err, 'Não foi possível salvar o fluxo. Tenta de novo.') },
    )
  }

  function toggleSymptom(s: string) {
    const next = activeSymptoms.includes(s) ? activeSymptoms.filter((x) => x !== s) : [...activeSymptoms, s]
    setSymptomsDraft(next)
    saveLog.mutate(
      { date, flow: (existing?.flow as CycleFlow | null) ?? null, symptoms: next, notes: existing?.notes ?? null },
      {
        onError: (err) => {
          setSymptomsDraft(null) // desfaz a marcação otimista — a chamada falhou, não ficou salvo de verdade
          toastError(err, 'Não foi possível salvar o sintoma. Tenta de novo.')
        },
      },
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-xs text-[var(--text-muted)]">Fluxo</p>
        <div className="flex flex-wrap gap-2">
          <Button variant={!existing?.flow ? 'primary' : 'secondary'} className="!py-1.5 !text-xs" onClick={() => setFlow(null)}>
            Nenhum
          </Button>
          {FLOW_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={existing?.flow === opt.value ? 'primary' : 'secondary'}
              className="!py-1.5 !text-xs"
              onClick={() => setFlow(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs text-[var(--text-muted)]">Sintomas</p>
        <div className="flex flex-wrap gap-2">
          {CYCLE_SYMPTOM_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSymptom(s)}
              className={clsx(
                'rounded-full border px-3 py-1.5 text-sm transition',
                activeSymptoms.includes(s)
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
