import { useState } from 'react'
import clsx from 'clsx'
import { useIntimateLogs, useSaveIntimateLog } from '../../api/intimateLogs'
import { toastError } from '../../lib/toast'
import type { IntimatePenetration, IntimatePain, IntimateType } from '../../../shared/types'

const INTIMATE_TYPE_OPTIONS: { value: IntimateType; label: string }[] = [
  { value: 'solo', label: 'Sozinha' },
  { value: 'partner', label: 'Com parceiro(a)' },
  { value: 'toy', label: 'Com brinquedo' },
]

const PENETRATION_OPTIONS: { value: IntimatePenetration; label: string }[] = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'vaginal', label: 'Vaginal' },
  { value: 'anal', label: 'Anal' },
]

const PAIN_OPTIONS: { value: IntimatePain; label: string }[] = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'light', label: 'Leve' },
  { value: 'strong', label: 'Forte' },
]

interface IntimateDraft {
  types: string[]
  penetration: string | null
  protection: boolean | null
  pain: string | null
  orgasm: boolean | null
}

export function intimateStatus(types: string[]): { filled: boolean; status: string } {
  if (types.length === 0) return { filled: false, status: 'Em aberto' }
  const labels = types.map((t) => INTIMATE_TYPE_OPTIONS.find((o) => o.value === t)?.label).filter(Boolean)
  return { filled: true, status: labels.join(' · ') }
}

interface IntimateLogLike {
  types: unknown
  penetration: string | null
  protection: boolean | null
  pain: string | null
  orgasm: boolean | null
}

/** Linhas de detalhe pra mostrar tudo que foi registrado num dia — mesmo padrão do resumo de humor. */
export function intimateDetailLines(log: IntimateLogLike | undefined): string[] {
  if (!log) return []
  const lines: string[] = []
  const types = (log.types as string[] | null) ?? []
  if (types.length > 0) {
    const labels = types.map((t) => INTIMATE_TYPE_OPTIONS.find((o) => o.value === t)?.label).filter(Boolean)
    lines.push(`Tipo: ${labels.join(', ')}`)
  }
  if (log.penetration) {
    const label = PENETRATION_OPTIONS.find((o) => o.value === log.penetration)?.label
    if (label) lines.push(`Penetração: ${label}`)
  }
  if (log.protection != null) lines.push(`Proteção: ${log.protection ? 'Sim' : 'Não'}`)
  if (log.pain && log.pain !== 'none') {
    const label = PAIN_OPTIONS.find((o) => o.value === log.pain)?.label
    if (label) lines.push(`Dor: ${label}`)
  }
  if (log.orgasm != null) lines.push(`Orgasmo: ${log.orgasm ? 'Sim' : 'Não'}`)
  return lines
}

export default function IntimateDayForm({ date }: { date: string }) {
  const { data: logs = [] } = useIntimateLogs({ from: date, to: date })
  const saveLog = useSaveIntimateLog()
  const existing = logs.find((l) => l.date === date)
  const [draft, setDraft] = useState<IntimateDraft | null>(null)
  const active: IntimateDraft = draft ?? {
    types: (existing?.types as string[] | null) ?? [],
    penetration: existing?.penetration ?? null,
    protection: existing?.protection ?? null,
    pain: existing?.pain ?? null,
    orgasm: existing?.orgasm ?? null,
  }

  function save(next: IntimateDraft) {
    setDraft(next)
    saveLog.mutate(
      { date, ...next, notes: existing?.notes ?? null },
      {
        onError: (err) => {
          setDraft(null) // desfaz a marcação otimista — a chamada falhou, não ficou salvo de verdade
          toastError(err, 'Não foi possível salvar. Tenta de novo.')
        },
      },
    )
  }

  function toggleType(t: string) {
    const types = active.types.includes(t) ? active.types.filter((x) => x !== t) : [...active.types, t]
    save({ ...active, types })
  }

  function chipClass(selected: boolean) {
    return clsx(
      'rounded-full border px-3 py-1.5 text-sm transition',
      selected
        ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
        : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]',
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-xs text-[var(--text-muted)]">Tipo</p>
        <div className="flex flex-wrap gap-2">
          {INTIMATE_TYPE_OPTIONS.map((opt) => (
            <button key={opt.value} type="button" onClick={() => toggleType(opt.value)} className={chipClass(active.types.includes(opt.value))}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs text-[var(--text-muted)]">Penetração</p>
        <div className="flex flex-wrap gap-2">
          {PENETRATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => save({ ...active, penetration: active.penetration === opt.value ? null : opt.value })}
              className={chipClass(active.penetration === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-6">
        <div>
          <p className="mb-2 text-xs text-[var(--text-muted)]">Proteção</p>
          <div className="flex gap-2">
            {[
              { value: true, label: 'Sim' },
              { value: false, label: 'Não' },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => save({ ...active, protection: active.protection === opt.value ? null : opt.value })}
                className={chipClass(active.protection === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs text-[var(--text-muted)]">Orgasmo</p>
          <div className="flex gap-2">
            {[
              { value: true, label: 'Sim' },
              { value: false, label: 'Não' },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => save({ ...active, orgasm: active.orgasm === opt.value ? null : opt.value })}
                className={chipClass(active.orgasm === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs text-[var(--text-muted)]">Dor</p>
        <div className="flex flex-wrap gap-2">
          {PAIN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => save({ ...active, pain: active.pain === opt.value ? null : opt.value })}
              className={chipClass(active.pain === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
