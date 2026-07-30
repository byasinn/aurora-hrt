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
    const t = setTimeout(() => setVisible(false), 3200)
    return () => clearTimeout(t)
  }, [])

  const dayIndex = new Date().getDate() % MESSAGES.length
  const name = profile?.displayName?.trim()

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setVisible(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} size={64} />
            <p className="text-lg text-white/80">
              {greeting()}
              {name ? `, ${name}` : ''}
            </p>
            <p className="max-w-xs text-2xl font-semibold text-white">{MESSAGES[dayIndex]}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
