import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Avatar from './Avatar'
import { useFollowSuggestions } from '../api/topics'
import { useFollow } from '../api/social'
import { toastError } from '../lib/toast'

/** Sugestão de gente pra seguir — baseada em tópico de interesse em comum (sinal principal) ou
 * "amigos de amigos" (quem as pessoas que você segue também seguem), calculado no servidor. */
export default function FollowSuggestions() {
  const { data: suggestions } = useFollowSuggestions()
  const follow = useFollow()
  // some na hora (otimista) em vez de esperar o refetch da sugestão — sem isso o card fica parado
  // ali com "Seguindo" depois de já ter seguido, que é confuso.
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())

  const visible = (suggestions ?? []).filter((s) => !dismissed.has(s.userId))

  if (visible.length === 0) return null

  function handleFollow(userId: number) {
    setDismissed((prev) => new Set(prev).add(userId))
    follow.mutate(userId, { onError: (err) => toastError(err, 'Não foi possível seguir.') })
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Sugestões pra seguir</p>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <AnimatePresence>
          {visible.map((s) => (
            <motion.div
              key={s.userId}
              layout
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.2 }}
              className="flex w-32 shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-center [box-shadow:var(--shadow)]"
            >
              <Link to={`/u/${s.username}`}>
                <Avatar src={s.avatarUrl} icon={s.avatarIcon} name={s.displayName} size={48} />
              </Link>
              <Link to={`/u/${s.username}`} className="min-w-0">
                <p className="truncate text-xs font-medium text-[var(--text)]">{s.displayName || `@${s.username}`}</p>
              </Link>
              <p className="truncate text-[10px] text-[var(--text-muted)]">
                {s.sharedTopics.length > 0 ? `Segue ${s.sharedTopics.join(', ')}` : 'Sugestão pra você'}
              </p>
              <button
                onClick={() => handleFollow(s.userId)}
                disabled={follow.isPending}
                className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-full bg-[var(--accent)] px-2 py-1.5 text-[11px] font-medium text-[var(--accent-contrast)] disabled:opacity-50"
              >
                <UserPlus size={12} /> Seguir
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
