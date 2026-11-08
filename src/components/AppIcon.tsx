import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LucideIcon } from 'lucide-react'
import PixelIcon, { type PixelIconName } from './PixelIcon'

// Visual do app: Clean (padrão, ícones de linha) ou 8-bit (opcional: pixel art e fonte de jogo).
// Escolhe no onboarding ou em Aparência — por isso cada uso passa as duas versões do ícone.

export type IconStyle = 'pixel' | 'classic'

interface IconStyleState {
  style: IconStyle
  setStyle: (style: IconStyle) => void
}

export const useIconStyle = create<IconStyleState>()(
  persist(
    (set) => ({
      style: 'classic',
      setStyle: (style) => set({ style }),
    }),
    { name: 'transapp.iconStyle' },
  ),
)

/** Ícone que respeita o estilo escolhido. Sem versão pixel, usa sempre o de linha. */
export default function AppIcon({
  icon: Icon,
  pixel,
  size = 22,
  className,
}: {
  icon: LucideIcon
  pixel?: PixelIconName
  size?: number
  className?: string
}) {
  const style = useIconStyle((s) => s.style)
  if (style === 'pixel' && pixel) {
    // pixel art tem traço mais grosso que o de linha — um tiquinho menor fica com o mesmo peso visual
    return <PixelIcon name={pixel} size={Math.round(size * 0.9)} className={className} />
  }
  return <Icon size={size} className={className} />
}
