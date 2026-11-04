import clsx from 'clsx'
import type { CSSProperties } from 'react'
import { AVATAR_FRAMES } from '../lib/shopVisuals'

export default function Avatar({
  src,
  icon,
  name,
  size = 36,
  ring = true,
  frame,
  className,
}: {
  src?: string | null
  icon?: string | null
  name?: string
  size?: number
  ring?: boolean
  /** moldura da lojinha (key de shared/shopCatalog.ts) — substitui o anel padrão */
  frame?: string | null
  className?: string
}) {
  const initial = name?.trim()?.[0]?.toUpperCase()
  const visual = frame ? AVATAR_FRAMES[frame] : undefined
  const shape = visual?.pixel ? 'rounded-none' : 'rounded-full'
  const showRing = ring && !visual

  const inner = src ? (
    <img
      src={src}
      alt={name ?? 'Foto de perfil'}
      style={{ width: size, height: size }}
      className={clsx(shape, 'object-cover', showRing && 'ring-2 ring-[var(--accent)]', className)}
    />
  ) : (
    <div
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className={clsx(
        shape,
        'flex items-center justify-center bg-gradient-to-br from-[var(--accent)] to-[var(--accent-soft)] font-semibold text-[var(--accent-contrast)]',
        showRing && 'ring-2 ring-[var(--accent)]',
        className,
      )}
    >
      {icon ?? initial ?? '🏳️‍⚧️'}
    </div>
  )

  if (!visual) return inner

  const pad = Math.max(2, Math.round(size * 0.08))
  if (visual.pixel) {
    return (
      <span
        className="pixel-frame inline-flex shrink-0"
        style={{ '--pf': visual.ring, '--pf-size': `${pad}px`, margin: pad } as CSSProperties}
      >
        {inner}
      </span>
    )
  }
  return (
    <span className="inline-flex shrink-0 rounded-full" style={{ padding: pad, background: visual.ring }}>
      {/* aro fininho da cor do fundo entre a moldura e a foto */}
      <span className="inline-flex rounded-full bg-[var(--surface)] p-[1.5px]">{inner}</span>
    </span>
  )
}
