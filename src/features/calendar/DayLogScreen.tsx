import { addDays, format, subDays } from 'date-fns'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Droplet, Sparkles, Pencil } from 'lucide-react'
import { Card, ScreenTitle } from '../../components/ui'
import DaySection from '../../components/DaySection'
import MoodCheckIn from '../mood/MoodCheckIn'
import CycleDayForm, { cycleStatus } from './CycleDayForm'
import IntimateDayForm, { intimateStatus } from './IntimateDayForm'
import NoteDayForm, { noteStatus } from './NoteDayForm'
import { useProfile } from '../../api/profile'
import { useCycleLogs } from '../../api/cycle'
import { useIntimateLogs } from '../../api/intimateLogs'
import { useDayNotes } from '../../api/dayNotes'
import { formatDateBR, todayStr } from '../../lib/dateUtils'

function toDateStr(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export default function DayLogScreen() {
  const [searchParams, setSearchParams] = useSearchParams()
  const date = searchParams.get('date') || todayStr()
  const { data: profile } = useProfile()

  const { data: cycleLogs = [] } = useCycleLogs({ from: date, to: date })
  const { data: intimateLogs = [] } = useIntimateLogs({ from: date, to: date })
  const { data: notes = [] } = useDayNotes({ from: date, to: date })

  const cycleLog = cycleLogs.find((l) => l.date === date)
  const intimateLog = intimateLogs.find((l) => l.date === date)
  const note = notes.find((n) => n.date === date)

  const cycleInfo = cycleStatus(cycleLog?.flow, (cycleLog?.symptoms as string[] | null) ?? [])
  const intimateInfo = intimateStatus((intimateLog?.types as string[] | null) ?? [])
  const noteInfo = noteStatus(note?.note)

  function goTo(d: Date) {
    setSearchParams({ date: toDateStr(d) })
  }

  const isToday = date === todayStr()

  return (
    <div className="space-y-4">
      <ScreenTitle>Registrar dia</ScreenTitle>

      <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
        <button onClick={() => goTo(subDays(new Date(`${date}T00:00:00`), 1))} className="text-[var(--text-muted)]">
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-medium text-[var(--text)]">{isToday ? 'Hoje' : formatDateBR(date)}</p>
        <button onClick={() => goTo(addDays(new Date(`${date}T00:00:00`), 1))} className="text-[var(--text-muted)]">
          <ChevronRight size={18} />
        </button>
      </div>

      <Card>
        <MoodCheckIn date={date} embedded />
      </Card>

      {profile?.cycleTrackingEnabled && (
        <DaySection icon={Droplet} label="Ciclo" status={cycleInfo.status} filled={cycleInfo.filled}>
          <CycleDayForm date={date} />
        </DaySection>
      )}

      {profile?.intimateTrackingEnabled && (
        <DaySection icon={Sparkles} label="Atividade íntima" status={intimateInfo.status} filled={intimateInfo.filled}>
          <IntimateDayForm date={date} />
        </DaySection>
      )}

      <DaySection icon={Pencil} label="Anotação" status={noteInfo.status} filled={noteInfo.filled}>
        <NoteDayForm date={date} />
      </DaySection>
    </div>
  )
}
