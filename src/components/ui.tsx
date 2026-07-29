import clsx from 'clsx'
import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return (
    <button
      className={clsx(
        'rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50',
        variant === 'primary' && 'bg-[var(--accent)] text-[#0b0f14]',
        variant === 'secondary' &&
          'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]',
        variant === 'ghost' && 'text-[var(--text-muted)] hover:text-[var(--text)]',
        className,
      )}
      {...props}
    />
  )
}

export function ScreenTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-4 text-xl font-semibold text-[var(--text)]">{children}</h1>
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-muted)]">
      {children}
    </p>
  )
}
