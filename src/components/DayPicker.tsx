import clsx from 'clsx'
import { weekdayLabel } from '../lib/dateUtils'

export default function DayPicker({
  singleSession,
  setSingleSession,
  days,
  toggleDay,
  label = 'Repetição',
}: {
  singleSession: boolean
  setSingleSession: (v: boolean) => void
  days: number[]
  toggleDay: (d: number) => void
  label?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{label}</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSingleSession(true)}
          className={clsx(
            'flex-1 rounded-xl border px-2 py-2 text-xs transition',
            singleSession
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
              : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]',
          )}
        >
          Sessão única
        </button>
        <button
          type="button"
          onClick={() => setSingleSession(false)}
          className={clsx(
            'flex-1 rounded-xl border px-2 py-2 text-xs transition',
            !singleSession
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
              : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]',
          )}
        >
          Repetir em dias fixos
        </button>
      </div>
      {!singleSession && (
        <div className="mt-2 flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => toggleDay(d)}
              className={clsx(
                'rounded-lg border px-2.5 py-1.5 text-xs transition',
                days.includes(d)
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]',
              )}
            >
              {weekdayLabel(d)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
