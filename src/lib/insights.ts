import type { DoseLog, MoodEntry, Medication } from '../../shared/types'
import { todayStr, daysBetween } from './dateUtils'

export interface Insight {
  icon: string
  text: string
}

function dateStr(iso: string | Date): string {
  return new Date(iso).toISOString().slice(0, 10)
}

export function computeInsights(params: {
  doseLogs: DoseLog[]
  moodEntries: MoodEntry[]
  medications: Medication[]
}): Insight[] {
  const { doseLogs, moodEntries, medications } = params
  const insights: Insight[] = []
  const today = todayStr()

  // Dias desde o último check-in de humor
  if (moodEntries.length > 0) {
    const lastMood = [...moodEntries].sort((a, b) => b.date.localeCompare(a.date))[0]
    const gap = daysBetween(lastMood.date, today)
    if (gap >= 2) {
      insights.push({
        icon: '💜',
        text: `Já fazem ${gap} dias sem check-in de humor — que tal registrar como você está?`,
      })
    }
  }

  // Adesão às doses nos últimos 7 dias
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const recentLogs = doseLogs.filter((l) => new Date(l.scheduledFor).getTime() >= weekAgo.getTime())
  const takenCount = recentLogs.filter((l) => l.status === 'taken').length
  const trackedCount = recentLogs.filter((l) => l.status === 'taken' || l.status === 'skipped').length
  if (trackedCount >= 3) {
    const pct = Math.round((takenCount / trackedCount) * 100)
    insights.push({
      icon: pct >= 90 ? '🌟' : pct >= 70 ? '👍' : '💡',
      text: `${pct}% das doses em dia nos últimos 7 dias (${takenCount}/${trackedCount}).`,
    })
  }

  // Energia no dia seguinte a uma injeção
  const injectionMedIds = new Set(medications.filter((m) => m.route === 'injection').map((m) => m.id))
  const injectionTakenDates = new Set(
    doseLogs
      .filter((l) => l.status === 'taken' && injectionMedIds.has(l.medicationId))
      .map((l) => dateStr(l.scheduledFor)),
  )
  const moodByDate = new Map(moodEntries.map((m) => [m.date, m]))

  const dayAfterInjectionEnergies: number[] = []
  const otherEnergies: number[] = []
  for (const mood of moodEntries) {
    if (mood.energyLevel == null) continue
    const prevDay = new Date(`${mood.date}T00:00:00`)
    prevDay.setDate(prevDay.getDate() - 1)
    const prevDayStr = prevDay.toISOString().slice(0, 10)
    if (injectionTakenDates.has(prevDayStr)) {
      dayAfterInjectionEnergies.push(mood.energyLevel)
    } else {
      otherEnergies.push(mood.energyLevel)
    }
  }
  if (dayAfterInjectionEnergies.length >= 3 && otherEnergies.length >= 3) {
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
    const afterAvg = avg(dayAfterInjectionEnergies)
    const otherAvg = avg(otherEnergies)
    if (otherAvg - afterAvg >= 0.8) {
      insights.push({
        icon: '🔋',
        text: 'Sua energia costuma ser mais baixa no dia seguinte à aplicação — pode ser normal, mas vale observar.',
      })
    }
  }

  // Faltando check-in do dia (útil como incentivo, não crítico)
  if (!moodByDate.has(today) && moodEntries.length === 0) {
    insights.push({ icon: '📝', text: 'Ainda não tem nenhum check-in de humor registrado. Que tal começar hoje?' })
  }

  return insights
}

export interface WeeklySummary {
  dosesTaken: number
  dosesTracked: number
  moodCheckIns: number
  avgEnergy: number | null
  avgLibido: number | null
}

export function computeWeeklySummary(params: { doseLogs: DoseLog[]; moodEntries: MoodEntry[] }): WeeklySummary {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().slice(0, 10)

  const recentLogs = params.doseLogs.filter((l) => new Date(l.scheduledFor).getTime() >= weekAgo.getTime())
  const recentMoods = params.moodEntries.filter((m) => m.date >= weekAgoStr)

  const energies = recentMoods.map((m) => m.energyLevel).filter((v): v is number => v != null)
  const libidos = recentMoods.map((m) => m.libidoLevel).filter((v): v is number => v != null)

  return {
    dosesTaken: recentLogs.filter((l) => l.status === 'taken').length,
    dosesTracked: recentLogs.filter((l) => l.status === 'taken' || l.status === 'skipped').length,
    moodCheckIns: recentMoods.length,
    avgEnergy: energies.length ? energies.reduce((a, b) => a + b, 0) / energies.length : null,
    avgLibido: libidos.length ? libidos.reduce((a, b) => a + b, 0) / libidos.length : null,
  }
}
