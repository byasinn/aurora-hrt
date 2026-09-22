import {
  CheckCircle2,
  Lock,
  Flame,
  Droplet,
  Clock,
  Mail,
  Wind,
  PenLine,
  Target,
  Zap,
  Hand,
  Users,
  Sparkles,
  Shirt,
  Footprints,
  EyeOff,
  VolumeX,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const TASK_ICON_OPTIONS: { key: string; Icon: LucideIcon }[] = [
  { key: 'check', Icon: CheckCircle2 },
  { key: 'lock', Icon: Lock },
  { key: 'flame', Icon: Flame },
  { key: 'droplet', Icon: Droplet },
  { key: 'clock', Icon: Clock },
  { key: 'mail', Icon: Mail },
  { key: 'wind', Icon: Wind },
  { key: 'pen', Icon: PenLine },
  { key: 'target', Icon: Target },
  { key: 'zap', Icon: Zap },
  { key: 'hand', Icon: Hand },
  { key: 'users', Icon: Users },
  { key: 'sparkles', Icon: Sparkles },
  { key: 'shirt', Icon: Shirt },
  { key: 'footprints', Icon: Footprints },
  { key: 'eye_off', Icon: EyeOff },
  { key: 'volume_x', Icon: VolumeX },
]

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(TASK_ICON_OPTIONS.map(({ key, Icon }) => [key, Icon]))

/** Tasks/atividades antigas guardam emoji direto — sem entrada aqui, cai no fallback (texto cru). */
export function getTaskIcon(key: string): LucideIcon | null {
  return ICON_MAP[key] ?? null
}

export const DEFAULT_TASK_ICON_KEY = 'check'
