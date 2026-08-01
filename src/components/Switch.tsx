import clsx from 'clsx'

export default function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-[var(--accent)]' : 'bg-[var(--border)]',
      )}
    >
      <span
        className={clsx(
          'absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0',
        )}
      />
    </button>
  )
}
