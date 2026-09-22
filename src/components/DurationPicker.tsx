import { useState } from 'react'
import clsx from 'clsx'
import { DURATION_OPTIONS } from '../lib/activityDuration'

export default function DurationPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | undefined
  onChange: (seconds: number | undefined) => void
}) {
  const [customOpen, setCustomOpen] = useState(false)
  const [customAmount, setCustomAmount] = useState(1)
  const [customUnit, setCustomUnit] = useState<'min' | 'h' | 'dias'>('h')

  function applyCustom() {
    const multiplier = customUnit === 'min' ? 60 : customUnit === 'h' ? 3600 : 86_400
    onChange(customAmount * multiplier)
    setCustomOpen(false)
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{label}</label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className={clsx(
            'rounded-lg border px-2.5 py-1.5 text-xs transition',
            value == null
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
              : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]',
          )}
        >
          Sem duração
        </button>
        {DURATION_OPTIONS.map((d) => (
          <button
            type="button"
            key={d.key}
            onClick={() => onChange(d.seconds)}
            className={clsx(
              'rounded-lg border px-2.5 py-1.5 text-xs transition',
              value === d.seconds
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]',
            )}
          >
            {d.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCustomOpen((o) => !o)}
          className="rounded-lg border border-dashed border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-muted)]"
        >
          Personalizado
        </button>
      </div>
      {customOpen && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={customAmount}
            onChange={(e) => setCustomAmount(Number(e.target.value))}
            className="w-20 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
          <select
            value={customUnit}
            onChange={(e) => setCustomUnit(e.target.value as 'min' | 'h' | 'dias')}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
          >
            <option value="min">min</option>
            <option value="h">h</option>
            <option value="dias">dias</option>
          </select>
          <button
            type="button"
            onClick={applyCustom}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-contrast)]"
          >
            Usar
          </button>
        </div>
      )}
    </div>
  )
}
