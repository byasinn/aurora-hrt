import { useEffect, useState } from 'react'
import { Minus, Plus, TimerOff } from 'lucide-react'

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining <= 0) {
      onDone()
      return
    }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining])

  const progress = Math.max(0, Math.min(1, remaining / seconds))

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--accent)] bg-[var(--surface-2)] p-3">
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
        <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border)" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeDasharray={2 * Math.PI * 16}
            strokeDashoffset={2 * Math.PI * 16 * (1 - progress)}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-[11px] font-medium text-[var(--text)]">{formatSeconds(remaining)}</span>
      </div>
      <p className="flex-1 text-sm text-[var(--text)]">Descansando…</p>
      <button
        type="button"
        onClick={() => setRemaining((r) => Math.max(0, r - 15))}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)]"
      >
        <Minus size={14} />
      </button>
      <button
        type="button"
        onClick={() => setRemaining((r) => r + 15)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)]"
      >
        <Plus size={14} />
      </button>
      <button
        type="button"
        onClick={onDone}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)]"
      >
        <TimerOff size={14} />
      </button>
    </div>
  )
}
