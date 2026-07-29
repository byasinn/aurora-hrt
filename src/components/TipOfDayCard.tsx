import { Card } from './ui'
import { useProfile } from '../api/profile'
import { useMedications } from '../api/medications'
import { tipsForContentPreference } from '../lib/tips'

export default function TipOfDayCard() {
  const { data: profile } = useProfile()
  const { data: medications = [] } = useMedications()

  const activeRoutes = [...new Set(medications.filter((m) => m.active).map((m) => m.route))]
  const tips = tipsForContentPreference(profile?.contentPreference, activeRoutes)
  if (tips.length === 0) return null

  const dayIndex = new Date().getDate() % tips.length
  const tip = tips[dayIndex]

  return (
    <Card className="mb-4 flex items-start gap-2 border-[var(--accent-2)] py-3">
      <span className="text-lg">{tip.icon}</span>
      <div>
        <p className="mb-0.5 text-xs font-medium text-[var(--text-muted)]">Dica do dia</p>
        <p className="text-sm text-[var(--text)]">{tip.text}</p>
      </div>
    </Card>
  )
}
