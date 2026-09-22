import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, User, Sparkles, ListChecks, Calendar, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Avatar from './Avatar'
import type { Profile } from '../../shared/types'

export default function NavDrawer({
  open,
  onClose,
  profile,
}: {
  open: boolean
  onClose: () => void
  profile: Profile | undefined
}) {
  const { t } = useTranslation()
  const DRAWER_LINKS = [
    { to: '/perfil', label: t('nav.profile'), icon: User },
    { to: '/pontos', label: t('nav.points'), icon: Sparkles },
    { to: '/routines', label: t('nav.routines'), icon: ListChecks },
    { to: '/calendar', label: t('nav.history'), icon: Calendar },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ]
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-y-0 left-0 z-50 flex w-[78%] max-w-xs flex-col bg-[var(--surface)] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] [box-shadow:var(--shadow)]"
          >
            <div className="flex items-center justify-between px-4 pb-3">
              <Link to="/perfil" onClick={onClose} className="flex items-center gap-2">
                <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} size={40} />
                <span className="text-sm font-medium text-[var(--text)]">{profile?.displayName || t('nav.profile')}</span>
              </Link>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 border-t border-[var(--border)] px-2 pt-2">
              {DRAWER_LINKS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)]"
                >
                  <Icon size={19} className="text-[var(--accent)]" />
                  {label}
                </Link>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
