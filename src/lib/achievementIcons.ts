import {
  Pill,
  Flame,
  Trophy,
  Star,
  Sparkles,
  PenLine,
  HeartPulse,
  Rainbow,
  Flag,
  PartyPopper,
  Eye,
  Droplets,
  Users,
  UsersRound,
  Camera,
  MessageCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  pill: Pill,
  flame: Flame,
  trophy: Trophy,
  star: Star,
  sparkles: Sparkles,
  pen: PenLine,
  heart_pulse: HeartPulse,
  rainbow: Rainbow,
  flag: Flag,
  party: PartyPopper,
  eye: Eye,
  droplets: Droplets,
  users: Users,
  users_round: UsersRound,
  camera: Camera,
  message: MessageCircle,
}

/** Troféus antigos (mensagens já criadas) podem ter emoji direto — sem entrada aqui, cai no fallback (texto cru). */
export function getAchievementIcon(key: string): LucideIcon | null {
  return ICON_MAP[key] ?? null
}
