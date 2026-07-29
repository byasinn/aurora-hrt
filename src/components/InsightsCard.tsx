import { Card } from './ui'
import { useDoseLogs } from '../api/doses'
import { useMoodEntries } from '../api/moods'
import { useMedications } from '../api/medications'
import { computeInsights } from '../lib/insights'

export default function InsightsCard() {
  const { data: doseLogs = [] } = useDoseLogs()
  const { data: moodEntries = [] } = useMoodEntries()
  const { data: medications = [] } = useMedications()

  const insights = computeInsights({ doseLogs, moodEntries, medications })
  if (insights.length === 0) return null

  return (
    <div className="mb-4 space-y-2">
      {insights.slice(0, 2).map((insight, i) => (
        <Card key={i} className="flex items-start gap-2 py-3">
          <span className="text-lg">{insight.icon}</span>
          <p className="text-sm text-[var(--text)]">{insight.text}</p>
        </Card>
      ))}
    </div>
  )
}
