import { useState } from 'react'
import { Card } from './ui'
import { useProfile } from '../api/profile'
import { useMedications } from '../api/medications'
import { tipsForContentPreference } from '../lib/tips'

export default function TipOfDayCard() {
  const { data: profile } = useProfile()
  const { data: medications = [] } = useMedications()
  const [index, setIndex] = useState<number | null>(null)

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

  return (
    <button type="button" onClick={next} className="mb-4 block w-full text-left">
      <Card className="flex items-start gap-2 border-[var(--accent-2)] py-3">
        <span className="text-lg">{tip.icon}</span>
        <div>
          <p className="mb-0.5 text-xs font-medium text-[var(--text-muted)]">Dica · toque para trocar</p>
          <p className="text-sm text-[var(--text)]">{tip.text}</p>
        </div>
      </Card>
    </button>
  )
}
