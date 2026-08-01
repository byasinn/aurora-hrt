import { Droplet, Apple, Footprints, Moon, Wind, Ban, BookOpen, Sun, CheckCircle2, Flame, Heart } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const ROUTINE_ICON_OPTIONS: { key: string; Icon: LucideIcon }[] = [
  { key: 'droplet', Icon: Droplet },
  { key: 'apple', Icon: Apple },
  { key: 'footprints', Icon: Footprints },
  { key: 'moon', Icon: Moon },
  { key: 'wind', Icon: Wind },
  { key: 'ban', Icon: Ban },
  { key: 'book', Icon: BookOpen },
  { key: 'sun', Icon: Sun },
  { key: 'check', Icon: CheckCircle2 },
  { key: 'flame', Icon: Flame },
  { key: 'heart', Icon: Heart },
]

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ROUTINE_ICON_OPTIONS.map(({ key, Icon }) => [key, Icon]),
)

/** Rotinas antigas guardam emoji direto no campo `icon` — sem entrada aqui, cai no fallback (texto cru). */
export function getRoutineIcon(key: string): LucideIcon | null {
  return ICON_MAP[key] ?? null
}

export const DEFAULT_ROUTINE_ICON_KEY = 'check'
