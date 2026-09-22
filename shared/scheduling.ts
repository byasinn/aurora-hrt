import type { FrequencyType, FrequencyValue } from './types'

// Único lugar com essa lógica agora — antes existiam 3 cópias quase idênticas (worker/shared/scheduling.ts,
// src/lib/scheduling.ts, src/lib/medicationSchedule.ts), que já tinham divergido um pouco entre si.
// Usado tanto pelo Worker (worker/routes/today.ts, worker/routes/medications.ts, worker/scheduled.ts)
// quanto pelo front (useMedicationSchedule.ts, MedicationsScreen.tsx, MedicationsCarousel.tsx).

export interface SchedulableMedication {
  frequencyType: FrequencyType | string
  frequencyValue?: FrequencyValue | unknown
  preferredTimes?: string[] // 'HH:MM' local, uma ou mais por dia
  active?: boolean
}

/** Converte 'YYYY-MM-DD' + 'HH:MM' interpretados num timezone IANA para um Date UTC. */
export function zonedTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const asIfUtc = new Date(`${dateStr}T${timeStr}:00.000Z`)
  const tzString = asIfUtc.toLocaleString('en-US', { timeZone })
  const asZoned = new Date(tzString)
  const offset = asIfUtc.getTime() - asZoned.getTime()
  return new Date(asIfUtc.getTime() + offset)
}

/** Data local (YYYY-MM-DD) de um instante, num timezone IANA. */
export function dateStrInTimezone(date: Date, timeZone: string): string {
  // locale en-CA dá YYYY-MM-DD direto
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date)
}

function weekdayInTimezone(date: Date, timeZone: string): number {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date)
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return map[weekday] ?? 0
}

/** Checa se um medicamento está "no calendário" pra data (string YYYY-MM-DD, no timezone do usuário) —
 * não diz em que horário(s), só se aquele dia é um dia de tomar. */
export function isDueOnDate(med: SchedulableMedication, dateStr: string, timeZone: string): boolean {
  if (med.frequencyType === 'daily') return true

  if (med.frequencyType === 'specific_days') {
    const days = (med.frequencyValue as { days?: number[] })?.days ?? []
    const refDate = zonedTimeToUtc(dateStr, '12:00', timeZone) // meio-dia evita bordas de DST
    return days.includes(weekdayInTimezone(refDate, timeZone))
  }

  if (med.frequencyType === 'every_n_days') {
    const { intervalDays, anchorDate } = (med.frequencyValue as {
      intervalDays?: number
      anchorDate?: string
    }) ?? {}
    if (!intervalDays || !anchorDate) return false
    const dayMs = 86_400_000
    const target = zonedTimeToUtc(dateStr, '12:00', timeZone).getTime()
    const anchor = zonedTimeToUtc(anchorDate, '12:00', timeZone).getTime()
    const diffDays = Math.round((target - anchor) / dayMs)
    return diffDays >= 0 && diffDays % intervalDays === 0
  }

  return false
}

/** Horários UTC exatos em que as doses do medicamento estão previstas numa data — um por
 * `preferredTimes`, em ordem cronológica. */
export function scheduledInstantsFor(med: SchedulableMedication, dateStr: string, timeZone: string): Date[] {
  const times = med.preferredTimes && med.preferredTimes.length > 0 ? med.preferredTimes : ['08:00']
  return [...times].sort().map((t) => zonedTimeToUtc(dateStr, t, timeZone))
}

/** Quantos dias (a partir de amanhã) até a próxima data prevista, procurando até `maxDays` à frente.
 * Null se não achar nenhuma nesse intervalo. */
export function daysUntilNextDue(med: SchedulableMedication, timeZone: string, maxDays = 60): number | null {
  const today = new Date()
  for (let i = 0; i <= maxDays; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    if (isDueOnDate(med, dateStrInTimezone(d, timeZone), timeZone)) return i
  }
  return null
}

/** Mesma ideia de daysUntilNextDue, mas a partir de uma data string específica (usado no card
 * "próxima dose em N dias" quando já se sabe o dia de referência). */
export function daysUntilNextDose(
  med: SchedulableMedication,
  fromDateStr: string,
  timeZone: string,
  maxDays = 120,
): number | null {
  const from = new Date(`${fromDateStr}T12:00:00.000Z`)
  for (let i = 1; i <= maxDays; i++) {
    const d = new Date(from)
    d.setUTCDate(d.getUTCDate() + i)
    if (isDueOnDate(med, dateStrInTimezone(d, timeZone), timeZone)) return i
  }
  return null
}

export function formatDaysUntil(days: number): string {
  if (days === 1) return 'amanhã'
  return `em ${days} dias`
}

export interface DueMedication<T extends SchedulableMedication = SchedulableMedication> {
  medication: T
  scheduledFor: Date
}

/** Lista os medicamentos ativos previstos para a data informada — um item por horário (não por
 * medicamento), pra suportar mais de uma dose no mesmo dia. */
export function dueMedicationsForDate<T extends SchedulableMedication>(
  meds: T[],
  dateStr: string,
  timeZone: string,
): DueMedication<T>[] {
  return meds
    .filter((m) => m.active && isDueOnDate(m, dateStr, timeZone))
    .flatMap((m) => scheduledInstantsFor(m, dateStr, timeZone).map((scheduledFor) => ({ medication: m, scheduledFor })))
}
