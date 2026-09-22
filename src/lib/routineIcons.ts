import {
  Droplet,
  Apple,
  Footprints,
  Moon,
  Wind,
  Ban,
  BookOpen,
  Sun,
  CheckCircle2,
  Flame,
  Heart,
  Hand,
  Dumbbell,
  Bed,
  Utensils,
  Brush,
  Smile,
  Target,
  Coffee,
  Leaf,
  Star,
  Bath,
  Music,
  Bike,
  Sparkles,
  PenLine,
  ClipboardCheck,
} from 'lucide-react'
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
  { key: 'hand', Icon: Hand },
  { key: 'dumbbell', Icon: Dumbbell },
  { key: 'bed', Icon: Bed },
  { key: 'utensils', Icon: Utensils },
  { key: 'brush', Icon: Brush },
  { key: 'smile', Icon: Smile },
  { key: 'target', Icon: Target },
  { key: 'coffee', Icon: Coffee },
  { key: 'leaf', Icon: Leaf },
  { key: 'star', Icon: Star },
  { key: 'bath', Icon: Bath },
  { key: 'music', Icon: Music },
  { key: 'bike', Icon: Bike },
  { key: 'sparkles', Icon: Sparkles },
  { key: 'pen', Icon: PenLine },
  { key: 'clipboard_check', Icon: ClipboardCheck },
]

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ROUTINE_ICON_OPTIONS.map(({ key, Icon }) => [key, Icon]),
)

/** Rotinas antigas guardam emoji direto no campo `icon` — sem entrada aqui, cai no fallback (texto cru). */
export function getRoutineIcon(key: string): LucideIcon | null {
  return ICON_MAP[key] ?? null
}

export const DEFAULT_ROUTINE_ICON_KEY = 'check'
