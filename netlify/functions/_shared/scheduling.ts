import type { FrequencyType, FrequencyValue } from '../../../shared/types'

export interface SchedulableMedication {
  frequencyType: FrequencyType | string
  frequencyValue?: FrequencyValue | unknown
  preferredTime: string
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

export function dateStrInTimezone(date: Date, timeZone: string): string {
  // en-CA locale gives YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date)
}

function weekdayInTimezone(date: Date, timeZone: string): number {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date)
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return map[weekday] ?? 0
}

/** Checa se um medicamento está "no calendário" para a data (string YYYY-MM-DD, no timezone do usuário). */
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

/** Horário UTC exato em que a dose do medicamento está prevista, para uma data (YYYY-MM-DD) no timezone do usuário. */
export function scheduledInstantFor(med: SchedulableMedication, dateStr: string, timeZone: string): Date {
  return zonedTimeToUtc(dateStr, med.preferredTime, timeZone)
}

export interface DueMedication<T extends SchedulableMedication = SchedulableMedication> {
  medication: T
  scheduledFor: Date
}

/** Lista os medicamentos ativos previstos para a data informada (padrão: hoje no timezone do usuário). */
export function dueMedicationsForDate<T extends SchedulableMedication>(
  meds: T[],
  dateStr: string,
  timeZone: string,
): DueMedication<T>[] {
  return meds
    .filter((m) => m.active && isDueOnDate(m, dateStr, timeZone))
    .map((m) => ({ medication: m, scheduledFor: scheduledInstantFor(m, dateStr, timeZone) }))
}
