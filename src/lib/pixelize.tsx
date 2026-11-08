import { forwardRef } from 'react'
import type { LucideIcon, LucideProps } from 'lucide-react'
import PixelIcon, { type PixelIconName } from '../components/PixelIcon'
import { useIconStyle } from '../components/AppIcon'

interface PixelOptions {
  /** versão pra quando o ícone vem preenchido (fill diferente de "none"), ex.: coração curtido */
  filled?: { name: PixelIconName; palette?: Record<string, string> }
}

/** Ícone do lucide que vira pixel art no visual 8-bit e volta ao de linha no Clean. */
export function pixelize(LineIcon: LucideIcon, pixel: PixelIconName, options: PixelOptions = {}): LucideIcon {
  const Icon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
    const style = useIconStyle((s) => s.style)
    if (style !== 'pixel') return <LineIcon ref={ref} {...props} />
    const size = Number(props.size ?? 24)
    const isFilled = options.filled && props.fill != null && props.fill !== 'none'
    // pixel art tem traço mais grosso que o de linha — um tiquinho menor fica com o mesmo peso visual
    return (
      <PixelIcon
        name={isFilled ? options.filled!.name : pixel}
        palette={isFilled ? options.filled!.palette : undefined}
        size={Math.round(size * 0.9)}
        className={props.className}
      />
    )
  })
  Icon.displayName = `Pixel(${pixel})`
  // mesma "cara" de tipo do lucide, pra continuar valendo onde o código espera um LucideIcon
  return Icon as unknown as LucideIcon
}
