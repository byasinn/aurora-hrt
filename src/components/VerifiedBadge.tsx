import { BadgeCheck } from 'lucide-react'

export default function VerifiedBadge({ size = 14 }: { size?: number }) {
  return <BadgeCheck size={size} className="inline shrink-0 text-[var(--accent)]" aria-label="Conta verificada" />
}
