import { useMedications } from '../../api/medications'
import { useToday, type TodayItem } from '../../api/doses'
import { useProfile } from '../../api/profile'
import { daysUntilNextDose } from '../../../shared/scheduling'
import { todayStr } from '../../lib/dateUtils'
import type { Medication } from '../../../shared/types'

export type MedCardState = 'pending' | 'taken' | 'upcoming'

export interface MedCard {
  medication: Medication
  state: MedCardState
  scheduledFor?: string
  doseLogId?: number | null
  isMissed?: boolean
  daysUntil?: number
}

export interface MedicationSchedule {
  cards: MedCard[]
  allDoneToday: boolean
  hasAnyToday: boolean
  isLoading: boolean
}

const STATE_ORDER: Record<MedCardState, number> = { pending: 0, taken: 1, upcoming: 2 }

export function useMedicationSchedule(): MedicationSchedule {
  const { data: medications, isLoading: medsLoading } = useMedications()
  const { data: today, isLoading: todayLoading } = useToday()
  const { data: profile } = useProfile()
  const timeZone = profile?.timezone ?? 'America/Sao_Paulo'
  const dateStr = today?.date ?? todayStr()

  const activeMeds = (medications ?? []).filter((m) => m.active)

  // um medicamento pode ter mais de um horário hoje agora — não dá mais pra reduzir a um item só
  // por medicamento (era isso que fazia só a última dose do dia aparecer, escondendo as outras).
  const itemsByMedId = new Map<number, TodayItem[]>()
  for (const item of today?.items ?? []) {
    const list = itemsByMedId.get(item.medication.id) ?? []
    list.push(item)
    itemsByMedId.set(item.medication.id, list)
  }
  const pendingOrMissedToday = (today?.items ?? []).filter((i) => i.status === 'pending' || i.status === 'missed')
  const hasAnyToday = (today?.items.length ?? 0) > 0
  const allDoneToday = hasAnyToday && pendingOrMissedToday.length === 0

  const cards: MedCard[] = activeMeds.flatMap((med): MedCard[] => {
    const items = itemsByMedId.get(med.id) ?? []
    if (items.length > 0 && !allDoneToday) {
      return items.map((item) => {
        const isMissed = item.status === 'missed'
        const isPending = item.status === 'pending' || isMissed
        return {
          medication: med,
          state: isPending ? ('pending' as const) : ('taken' as const),
          scheduledFor: item.scheduledFor,
          doseLogId: item.doseLogId,
          isMissed,
        }
      })
    }

    const days = daysUntilNextDose(med, dateStr, timeZone)
    return [{ medication: med, state: 'upcoming', daysUntil: days ?? undefined }]
  })

  cards.sort((a, b) => {
    const diff = STATE_ORDER[a.state] - STATE_ORDER[b.state]
    if (diff !== 0) return diff
    if (a.state === 'pending') return (a.scheduledFor ?? '').localeCompare(b.scheduledFor ?? '')
    if (a.state === 'upcoming') return (a.daysUntil ?? 999) - (b.daysUntil ?? 999)
    return 0
  })

  return { cards, allDoneToday, hasAnyToday, isLoading: medsLoading || todayLoading }
}
