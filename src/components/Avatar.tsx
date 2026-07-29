import clsx from 'clsx'

export default function Avatar({
  src,
  name,
  size = 36,
  className,
}: {
  src?: string | null
  name?: string
  size?: number
  className?: string
}) {
  const initial = name?.trim()?.[0]?.toUpperCase()

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Foto de perfil'}
        style={{ width: size, height: size }}
        className={clsx('rounded-full object-cover ring-2 ring-[var(--accent)]', className)}
      />
    )
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className={clsx(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-soft)] font-semibold text-[var(--accent-contrast)] ring-2 ring-[var(--accent)]',
        className,
      )}
    >
      {initial ?? '🏳️‍⚧️'}
    </div>
  )
}
