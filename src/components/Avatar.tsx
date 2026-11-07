import clsx from 'clsx'
import type { CSSProperties } from 'react'
import { AVATAR_FRAMES, type OrnamentPos } from '../lib/shopVisuals'
import PixelIcon from './PixelIcon'

// onde cada enfeite fica, relativo à moldura (o enfeite sai um pouco pra fora, como adesivo)
const ORNAMENT_POS: Record<OrnamentPos, CSSProperties> = {
  top: { left: '50%', top: 0, transform: 'translate(-50%, -58%)' },
  'top-left': { left: 0, top: 0, transform: 'translate(-22%, -22%)' },
  'top-right': { right: 0, top: 0, transform: 'translate(22%, -22%)' },
  'bottom-left': { left: 0, bottom: 0, transform: 'translate(-22%, 22%)' },
  'bottom-right': { right: 0, bottom: 0, transform: 'translate(22%, 22%)' },
}

// abaixo disso (ícones da barra de navegação) enfeite vira ruído — fica só o anel
const MIN_ORNAMENT_SIZE = 30

export default function Avatar({
  src,
  icon,
  name,
  size = 36,
  ring = true,
  frame,
  showOrnaments,
  className,
}: {
  src?: string | null
  icon?: string | null
  name?: string
  size?: number
  ring?: boolean
  /** moldura da lojinha (key de shared/shopCatalog.ts) — substitui o anel padrão */
  frame?: string | null
  /** força os enfeites mesmo em avatar pequeno (ex.: aba "Meu espaço" da barra de baixo) */
  showOrnaments?: boolean
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
      // text-[0px]: se a foto não carregar, o texto alternativo não vaza pra fora do círculo
      className={clsx(shape, 'overflow-hidden object-cover text-[0px]', showRing && 'ring-2 ring-[var(--accent)]', className)}
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

  const pad = Math.max(2, Math.round(size * (visual.thickness ?? 0.09)))
  // A moldura não pode ocupar espaço: o avatar com moldura tem que ter exatamente o mesmo tamanho
  // de um sem moldura, senão ele desce/desalinha nas linhas do feed, comentários e perfil. O anel
  // transborda pra fora (margem negativa), como os enfeites.
  const ringOverflow = pad + 1.5
  const decorated = showOrnaments ?? size >= MIN_ORNAMENT_SIZE
  const ornaments =
    decorated &&
    visual.ornaments?.map((o, i) => (
      <span key={i} className="pointer-events-none absolute z-20 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" style={ORNAMENT_POS[o.pos]}>
        <PixelIcon name={o.icon} size={Math.round(size * (o.scale ?? 0.36))} palette={o.palette} />
      </span>
    ))

  if (visual.pixel) {
    return (
      <span
        className="pixel-frame relative inline-flex shrink-0"
        // pixel-frame desenha a borda com box-shadow, que já fica fora da caixa — sem margem nenhuma
        style={{ '--pf': visual.ring, '--pf-size': `${pad}px` } as CSSProperties}
      >
        {inner}
        {ornaments}
      </span>
    )
  }

  return (
    <span className="relative inline-flex shrink-0" style={{ margin: -ringOverflow }}>
      {decorated && visual.ears && (
        <svg
          aria-hidden
          viewBox="0 0 100 40"
          className="pointer-events-none absolute left-0 z-0 w-full"
          style={{ top: -size * 0.2, height: size * 0.4 }}
        >
          <polygon points="10,40 20,0 44,28" fill={visual.ears.color} />
          <polygon points="17,34 22,12 36,28" fill={visual.ears.inner} />
          <polygon points="56,28 80,0 90,40" fill={visual.ears.color} />
          <polygon points="64,28 78,12 83,34" fill={visual.ears.inner} />
        </svg>
      )}
      <span className="relative z-10 inline-flex rounded-full" style={{ padding: pad, background: visual.ring, boxShadow: visual.glow }}>
        {/* aro fininho da cor do fundo entre a moldura e a foto */}
        <span className="inline-flex rounded-full bg-[var(--surface)] p-[1.5px]">{inner}</span>
      </span>
      {ornaments}
    </span>
  )
}
