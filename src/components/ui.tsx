import clsx from 'clsx'
import { motion } from 'framer-motion'
import type { HTMLAttributes } from 'react'
import type { HTMLMotionProps } from 'framer-motion'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 [box-shadow:var(--shadow)]',
        className,
      )}
      {...props}
    />
  )
}

// Alvos de toque de no mínimo 44px (md) — botão pequeno com texto miúdo era difícil de acertar no celular.
export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: HTMLMotionProps<'button'> & { variant?: 'primary' | 'secondary' | 'ghost'; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <motion.button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-bold disabled:opacity-50',
        size === 'sm' && 'min-h-9 px-3.5 text-sm',
        size === 'md' && 'min-h-11 px-5 text-[15px]',
        size === 'lg' && 'min-h-14 px-6 text-base',
        variant === 'primary' && 'btn-press bg-[var(--accent)] text-[var(--accent-contrast)]',
        variant === 'secondary' &&
          'btn-press-soft border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]',
        variant === 'ghost' && 'text-[var(--text-muted)] transition hover:text-[var(--text)]',
        className,
      )}
      {...props}
    />
  )
}

export function ScreenTitle({ children, subtitle }: { children: React.ReactNode; subtitle?: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text)]">{children}</h1>
      {subtitle && <p className="mt-0.5 text-sm text-[var(--text-muted)]">{subtitle}</p>}
    </div>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-3xl border-2 border-dashed border-[var(--border)] p-6 text-center text-[15px] text-[var(--text-muted)]">
      {children}
    </p>
  )
}
