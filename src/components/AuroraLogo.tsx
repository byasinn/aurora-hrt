import clsx from 'clsx'
import PixelIcon from './PixelIcon'
import { useIconStyle, type IconStyle } from './AppIcon'

// Logo "Aurora". No 8-bit: borboleta em pixel art + nome na fonte pixel, com degradê em faixas e
// sombra dura (sem desfoque), jeito de letreiro de jogo. No Clean: o texto de sempre.

export default function AuroraLogo({
  height = 22,
  className,
  variant,
}: {
  height?: number
  className?: string
  /** força um visual (prévia da escolha); sem isso segue o visual ligado */
  variant?: IconStyle
}) {
  const current = useIconStyle((s) => s.style)
  const style = variant ?? current

  if (style !== 'pixel') {
    return (
      <span className={clsx('font-logo flag-gradient-text uppercase tracking-wide', className)} style={{ fontSize: height * 0.82 }}>
        Aurora
      </span>
    )
  }

  return (
    <span className={clsx('inline-flex items-center', className)} style={{ gap: height * 0.25 }} role="img" aria-label="Aurora">
      <PixelIcon name="butterfly" size={Math.round(height * 0.8)} />
      <span className="aurora-logo-pixel" style={{ fontSize: Math.round(height * 0.72) }} aria-hidden>
        Aurora
      </span>
    </span>
  )
}
