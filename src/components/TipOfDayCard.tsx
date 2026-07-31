import { useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { X } from 'lucide-react'
import { Card } from './ui'
import { useProfile, useUpdateProfile } from '../api/profile'
import { useMedications } from '../api/medications'
import { tipsForContentPreference } from '../lib/tips'

const DISMISS_THRESHOLD = 90

export default function TipOfDayCard() {
  const { data: profile } = useProfile()
  const { data: medications = [] } = useMedications()
  const updateProfile = useUpdateProfile()
  const [index, setIndex] = useState<number | null>(null)
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-160, 0, 160], [0, 1, 0])

  const activeRoutes = [...new Set(medications.filter((m) => m.active).map((m) => m.route))]
  const tips = tipsForContentPreference(profile?.contentPreference, activeRoutes)

  if (profile && profile.showTipsOnHome === false) return null
  if (tips.length === 0) return null

  const currentIndex = index ?? new Date().getDate() % tips.length
  const tip = tips[currentIndex]

  function next() {
    if (tips.length <= 1) return
    let n = Math.floor(Math.random() * tips.length)
    if (n === currentIndex) n = (n + 1) % tips.length
    setIndex(n)
  }

  function dismiss() {
    updateProfile.mutate({ showTipsOnHome: false })
  }

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (Math.abs(info.offset.x) > DISMISS_THRESHOLD) {
      animate(x, info.offset.x > 0 ? 400 : -400, { duration: 0.2 })
      dismiss()
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
    }
  }

  return (
    <motion.div
      className="mb-4"
      style={{ x, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
    >
      <button type="button" onClick={next} className="block w-full text-left">
        <Card className="flex items-start gap-2 border-[var(--accent-2)] py-3">
          <span className="text-lg">{tip.icon}</span>
          <div className="flex-1">
            <p className="mb-0.5 text-xs font-medium text-[var(--text-muted)]">
              Dica · toque para trocar · arraste pra esconder
            </p>
            <p className="text-sm text-[var(--text)]">{tip.text}</p>
          </div>
          <X
            size={14}
            className="mt-0.5 shrink-0 text-[var(--text-muted)]"
            onClick={(e) => {
              e.stopPropagation()
              dismiss()
            }}
          />
        </Card>
      </button>
    </motion.div>
  )
}
