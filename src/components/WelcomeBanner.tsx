import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfile } from '../api/profile'
import Avatar from './Avatar'

const SEEN_KEY = 'transapp.welcomeSeenAt'

const MESSAGES = [
  'Um passo de cada vez. 💜',
  'Você está indo bem — continue assim.',
  'Cuidar de si mesma também é isso.',
  'Cada dose é um dia mais perto de você.',
  'Orgulho da sua jornada, hoje e sempre.',
  'Respira. Você está no seu tempo certo.',
]

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Boa noite'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function WelcomeBanner() {
  const { data: profile } = useProfile()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SEEN_KEY)) return
    sessionStorage.setItem(SEEN_KEY, String(Date.now()))
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(t)
  }, [])

  const dayIndex = new Date().getDate() % MESSAGES.length
  const name = profile?.displayName?.trim()

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={() => setVisible(false)}
          className="fixed left-1/2 top-[max(3.5rem,env(safe-area-inset-top))] z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 cursor-pointer"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 [box-shadow:var(--shadow)]">
            <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} size={44} />
            <div>
              <p className="text-sm text-[var(--text-muted)]">
                {greeting()}
                {name ? `, ${name}` : ''}
              </p>
              <p className="text-sm font-medium flag-gradient-text">{MESSAGES[dayIndex]}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
