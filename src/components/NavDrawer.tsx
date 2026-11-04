import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Avatar from './Avatar'
import { useSecondaryNavItems } from './navItems'
import { playSound } from '../lib/sounds'
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
  const links = useSecondaryNavItems()
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
            className="fixed inset-y-0 left-0 z-50 flex w-[80%] max-w-xs flex-col rounded-r-3xl bg-[var(--surface)] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] [box-shadow:var(--shadow)]"
          >
            <div className="flex items-center justify-between px-4 pb-4">
              <Link to="/perfil" onClick={onClose} className="flex min-w-0 items-center gap-3">
                <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} size={48} />
                <span className="truncate text-base font-bold text-[var(--text)]">{profile?.displayName || t('nav.profile')}</span>
              </Link>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 border-t border-[var(--border)] px-3 pt-3">
              {links.map(({ to, label, Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => {
                    playSound('tap')
                    onClose()
                  }}
                  className="flex min-h-13 items-center gap-3 rounded-2xl px-3 text-base font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Icon size={19} />
                  </span>
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
