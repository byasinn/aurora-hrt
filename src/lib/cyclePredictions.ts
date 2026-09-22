import type { CycleLog, CyclePrediction } from '../../shared/types'
import { todayStr } from './dateUtils'

const DAY_MS = 86_400_000
const LUTEAL_PHASE_DAYS = 14 // média entre ovulação e o próximo período

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / DAY_MS)
}

/** Primeiro dia de cada "sequência" de fluxo registrado — ou seja, o início de cada período. */
export function periodStartDates(logs: CycleLog[]): string[] {
  const flowDates = [...new Set(logs.filter((l) => l.flow).map((l) => l.date))].sort()
  const starts: string[] = []
  for (const date of flowDates) {
    const prevDay = addDays(date, -1)
    if (!flowDates.includes(prevDay)) starts.push(date)
  }
  return starts
}

export function predictCycle(
  logs: CycleLog[],
  fallbackCycleLength: number,
  today: string = todayStr(),
): CyclePrediction {
  const starts = periodStartDates(logs)

  let averageCycleLength = fallbackCycleLength
  if (starts.length >= 2) {
    const gaps = starts.slice(1).map((s, i) => diffDays(starts[i], s))
    const plausible = gaps.filter((g) => g >= 15 && g <= 60)
    if (plausible.length > 0) {
      averageCycleLength = Math.round(plausible.reduce((a, b) => a + b, 0) / plausible.length)
    }
  }

  const lastStart = starts[starts.length - 1] ?? null
  if (!lastStart) {
    return {
      cycleDay: null,
      nextPeriodStart: null,
      ovulationDate: null,
      fertileWindowStart: null,
      fertileWindowEnd: null,
      averageCycleLength,
    }
  }

  const nextPeriodStart = addDays(lastStart, averageCycleLength)
  const ovulationDate = addDays(nextPeriodStart, -LUTEAL_PHASE_DAYS)
  const cycleDay = diffDays(lastStart, today) + 1

  return {
    cycleDay,
    nextPeriodStart,
    ovulationDate,
    fertileWindowStart: addDays(ovulationDate, -5),
    fertileWindowEnd: addDays(ovulationDate, 1),
    averageCycleLength,
  }
}
