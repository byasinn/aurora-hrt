import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import { Card } from './ui'

export default function DaySection({
  icon: Icon,
  label,
  status,
  filled,
  children,
}: {
  icon: LucideIcon
  label: string
  status: string
  filled: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(!filled)

  return (
    <Card className="space-y-0">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 text-left">
        <span
          className={clsx(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            filled
              ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
              : 'border border-dashed border-[var(--border)] text-[var(--text-muted)]',
          )}
        >
          <Icon size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-[var(--text)]">{label}</span>
          <span className="block truncate text-xs text-[var(--text-muted)]">{status}</span>
        </span>
        <ChevronDown size={16} className={clsx('shrink-0 text-[var(--text-muted)] transition', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-3 border-t border-[var(--border)] pt-3">{children}</div>}
    </Card>
  )
}
