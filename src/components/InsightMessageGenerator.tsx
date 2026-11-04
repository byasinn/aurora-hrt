import { useEffect, useState } from 'react'
import { useDoseLogs } from '../api/doses'
import { useMoodEntries } from '../api/moods'
import { useMedications } from '../api/medications'
import { useCreateMessage, useMessages } from '../api/messages'
import { computeInsights } from '../lib/insights'
import { localDateStr, todayStr } from '../lib/dateUtils'

const FLAG_KEY = 'transapp.lastInsightMessageDate'
// Os insights olham a última semana e a relação humor × aplicação; 90 dias dá folga sem baixar o
// histórico inteiro (que pode ter milhares de doses) em toda tela.
const HISTORY_DAYS = 90

function Generate() {
  const [from] = useState(() => new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString())
  const doseLogsQuery = useDoseLogs({ from })
  const moodEntriesQuery = useMoodEntries()
  const medicationsQuery = useMedications()
  const messagesQuery = useMessages()
  const createMessage = useCreateMessage()

  const ready = doseLogsQuery.isSuccess && moodEntriesQuery.isSuccess && medicationsQuery.isSuccess && messagesQuery.isSuccess

  useEffect(() => {
    if (!ready) return
    const today = todayStr()
    localStorage.setItem(FLAG_KEY, today)
    // a flag local só vale pra este aparelho — celular + PC geravam um insight cada
    const alreadySentToday = (messagesQuery.data ?? []).some(
      (m) => m.title === 'Insight' && localDateStr(new Date(m.createdAt)) === today,
    )
    if (alreadySentToday) return

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

/** Sem UI própria: gera no máximo 1 mensagem/dia com um insight, se houver. */
export default function InsightMessageGenerator() {
  // só busca os dados se ainda não rodou hoje neste aparelho
  const [due] = useState(() => localStorage.getItem(FLAG_KEY) !== todayStr())
  return due ? <Generate /> : null
}
