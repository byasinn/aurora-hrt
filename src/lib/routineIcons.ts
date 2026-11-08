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
import { pixelize } from './pixelize'

// cada ícone vira pixel art no visual 8-bit e volta ao de linha no Clean

export const ROUTINE_ICON_OPTIONS: { key: string; Icon: LucideIcon }[] = [
  { key: 'droplet', Icon: pixelize(Droplet, 'droplet') },
  { key: 'apple', Icon: pixelize(Apple, 'apple') },
  { key: 'footprints', Icon: pixelize(Footprints, 'footprints') },
  { key: 'moon', Icon: pixelize(Moon, 'moonLine') },
  { key: 'wind', Icon: pixelize(Wind, 'wind') },
  { key: 'ban', Icon: pixelize(Ban, 'ban') },
  { key: 'book', Icon: pixelize(BookOpen, 'book') },
  { key: 'sun', Icon: pixelize(Sun, 'sun') },
  { key: 'check', Icon: pixelize(CheckCircle2, 'checkCircle') },
  { key: 'flame', Icon: pixelize(Flame, 'flame') },
  { key: 'heart', Icon: pixelize(Heart, 'heart') },
  { key: 'hand', Icon: pixelize(Hand, 'hand') },
  { key: 'dumbbell', Icon: pixelize(Dumbbell, 'dumbbell') },
  { key: 'bed', Icon: pixelize(Bed, 'bed') },
  { key: 'utensils', Icon: pixelize(Utensils, 'utensils') },
  { key: 'brush', Icon: pixelize(Brush, 'brush') },
  { key: 'smile', Icon: pixelize(Smile, 'smile') },
  { key: 'target', Icon: pixelize(Target, 'target') },
  { key: 'coffee', Icon: pixelize(Coffee, 'coffee') },
  { key: 'leaf', Icon: pixelize(Leaf, 'leaf') },
  { key: 'star', Icon: pixelize(Star, 'star') },
  { key: 'bath', Icon: pixelize(Bath, 'bath') },
  { key: 'music', Icon: pixelize(Music, 'music') },
  { key: 'bike', Icon: pixelize(Bike, 'bike') },
  { key: 'sparkles', Icon: pixelize(Sparkles, 'sparkle') },
  { key: 'pen', Icon: pixelize(PenLine, 'pencil') },
  { key: 'clipboard_check', Icon: pixelize(ClipboardCheck, 'checklist') },
]

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ROUTINE_ICON_OPTIONS.map(({ key, Icon }) => [key, Icon]),
)

/** Rotinas antigas guardam emoji direto no campo `icon` — sem entrada aqui, cai no fallback (texto cru). */
export function getRoutineIcon(key: string): LucideIcon | null {
  return ICON_MAP[key] ?? null
}

export const DEFAULT_ROUTINE_ICON_KEY = 'check'
