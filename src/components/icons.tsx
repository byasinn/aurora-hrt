import { forwardRef } from 'react'
import * as Lucide from 'lucide-react'
import type { LucideIcon, LucideProps } from 'lucide-react'
import PixelIcon, { type PixelIconName } from './PixelIcon'
import { useIconStyle } from './AppIcon'

// Ícones com o mesmo nome dos do lucide-react, que viram pixel art no visual 8-bit e voltam ao de
// linha no Clean. As telas importam daqui em vez de 'lucide-react' — trocar o visual não precisa
// mexer em tela nenhuma. Ícone que não está aqui continua vindo direto do lucide.

interface PixelOptions {
  /** versão pra quando o ícone vem preenchido (fill diferente de "none"), ex.: coração curtido */
  filled?: { name: PixelIconName; palette?: Record<string, string> }
}

function pixelize(LineIcon: LucideIcon, pixel: PixelIconName, options: PixelOptions = {}): LucideIcon {
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

export const Plus = pixelize(Lucide.Plus, 'plus')
export const Minus = pixelize(Lucide.Minus, 'minus')
export const ChevronLeft = pixelize(Lucide.ChevronLeft, 'chevronLeft')
export const ChevronRight = pixelize(Lucide.ChevronRight, 'chevronRight')
export const ChevronDown = pixelize(Lucide.ChevronDown, 'chevronDown')
export const ArrowLeft = pixelize(Lucide.ArrowLeft, 'arrowLeft')
export const Trash2 = pixelize(Lucide.Trash2, 'trash')
export const Check = pixelize(Lucide.Check, 'check')
export const X = pixelize(Lucide.X, 'x')
export const Pencil = pixelize(Lucide.Pencil, 'pencil')
export const Sparkles = pixelize(Lucide.Sparkles, 'sparkle')
export const MessageCircle = pixelize(Lucide.MessageCircle, 'chat')
export const MessageSquare = pixelize(Lucide.MessageSquare, 'chat')
export const Users = pixelize(Lucide.Users, 'users')
export const User = pixelize(Lucide.User, 'user')
export const UserPlus = pixelize(Lucide.UserPlus, 'userPlus')
export const Trophy = pixelize(Lucide.Trophy, 'trophy')
export const Store = pixelize(Lucide.Store, 'bag')
// curtido: o ícone vem com fill="currentColor" (vermelho) — no pixel vira o coração cheio
export const Heart = pixelize(Lucide.Heart, 'heartOutline', { filled: { name: 'heart', palette: { a: 'currentColor' } } })
export const HeartPulse = pixelize(Lucide.HeartPulse, 'health')
export const Search = pixelize(Lucide.Search, 'search')
export const Pill = pixelize(Lucide.Pill, 'pill')
export const Flag = pixelize(Lucide.Flag, 'flag')
export const Droplet = pixelize(Lucide.Droplet, 'droplet')
export const History = pixelize(Lucide.History, 'clock')
export const Lock = pixelize(Lucide.Lock, 'lock')
export const ListChecks = pixelize(Lucide.ListChecks, 'checklist')
export const Bell = pixelize(Lucide.Bell, 'bell')
export const Flame = pixelize(Lucide.Flame, 'flame')
export const Settings = pixelize(Lucide.Settings, 'gear')
export const Home = pixelize(Lucide.Home, 'home')
export const Repeat2 = pixelize(Lucide.Repeat2, 'repeat')
export const Ruler = pixelize(Lucide.Ruler, 'ruler')
export const Send = pixelize(Lucide.Send, 'send')
export const Camera = pixelize(Lucide.Camera, 'camera')
export const Calendar = pixelize(Lucide.Calendar, 'calendar')
export const Dumbbell = pixelize(Lucide.Dumbbell, 'dumbbell')
export const Shield = pixelize(Lucide.Shield, 'shield')
export const ShieldCheck = pixelize(Lucide.ShieldCheck, 'shield')
export const Palette = pixelize(Lucide.Palette, 'palette')
export const Globe = pixelize(Lucide.Globe, 'globe')
export const FileText = pixelize(Lucide.FileText, 'file')
export const Info = pixelize(Lucide.Info, 'info')
export const Image = pixelize(Lucide.Image, 'picture')
export const Star = pixelize(Lucide.Star, 'star')
export const Gem = pixelize(Lucide.Gem, 'sparkle')
export const Coins = pixelize(Lucide.Coins, 'coin')
