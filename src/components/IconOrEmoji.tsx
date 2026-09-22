import { getRoutineIcon } from '../lib/routineIcons'

/** Ícone com fallback pra emoji cru (ex: 🍑) quando a chave não bate com nenhum ícone lucide conhecido. */
export default function IconOrEmoji({ icon, size = 18, className }: { icon: string; size?: number; className?: string }) {
  const Icon = getRoutineIcon(icon)
  if (Icon) return <Icon size={size} className={className} />
  return (
    <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
      {icon}
    </span>
  )
}
