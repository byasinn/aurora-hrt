import { useEffect } from 'react'
import { useDoseLogs } from '../api/doses'
import { useMoodEntries } from '../api/moods'
import { useMedications } from '../api/medications'
import { useCreateMessage } from '../api/messages'
import { computeInsights } from '../lib/insights'
import { todayStr } from '../lib/dateUtils'

const FLAG_KEY = 'transapp.lastInsightMessageDate'

/** Sem UI própria: gera no máximo 1 mensagem/dia com um insight, se houver. */
export default function InsightMessageGenerator() {
  const doseLogsQuery = useDoseLogs()
  const moodEntriesQuery = useMoodEntries()
  const medicationsQuery = useMedications()
  const createMessage = useCreateMessage()

  const ready = doseLogsQuery.isSuccess && moodEntriesQuery.isSuccess && medicationsQuery.isSuccess

  useEffect(() => {
    if (!ready) return
    const today = todayStr()
    if (localStorage.getItem(FLAG_KEY) === today) return
    localStorage.setItem(FLAG_KEY, today)

    const insights = computeInsights({
      doseLogs: doseLogsQuery.data ?? [],
      moodEntries: moodEntriesQuery.data ?? [],
      medications: medicationsQuery.data ?? [],
    })
    const top = insights[0]
    if (top) {
      createMessage.mutate({ icon: top.icon, title: 'Insight', body: top.text })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return null
}
