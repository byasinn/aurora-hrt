import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Heart, ListChecks } from 'lucide-react'
import { EmptyState } from '../../components/ui'
import { useToday } from '../../api/doses'
import { useProfile } from '../../api/profile'
import { useMedications } from '../../api/medications'
import { useRoutines } from '../../api/routines'
import { useWorkoutPrograms, useWorkoutLogs } from '../../api/workouts'
import { todayStr } from '../../lib/dateUtils'
import WelcomeBanner from '../../components/WelcomeBanner'
import TipOfDayCard from '../../components/TipOfDayCard'
import MedicationForm from './MedicationForm'
import MedicationsCarousel from './MedicationsCarousel'
import { WorkoutTodayCarousel, RoutinesTodayList, type WorkoutTodayItem } from './TodayActivitiesCarousel'
import type { Medication } from '../../../shared/types'

function AddDoseButton({ prominent, onClick }: { prominent: boolean; onClick: () => void }) {
  const { t } = useTranslation()
  if (prominent) {
    return (
      <button
        onClick={onClick}
        className="flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl py-6 text-[var(--accent-contrast)] [box-shadow:var(--shadow)]"
        style={{ background: 'var(--accent)' }}
      >
        <Plus size={24} />
        <span className="text-sm font-medium">{t('today.addDose')}</span>
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] py-3 text-sm text-[var(--text-muted)]"
    >
      <Plus size={16} />
      {t('today.addDose')}
    </button>
  )
}

function BigLinkButton({
  to,
  icon: Icon,
  label,
  variant,
  state,
  big,
}: {
  to: string
  icon: typeof Heart
  label: string
  variant: 'accent' | 'accent2' | 'outline'
  state?: unknown
  big?: boolean
}) {
  if (variant === 'outline') {
    return (
      <Link to={to} state={state} className="flex-1">
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] py-3.5 text-sm text-[var(--text-muted)]">
          <Icon size={18} />
          <span className="font-medium">{label}</span>
        </div>
      </Link>
    )
  }
  return (
    <Link to={to} state={state} className="flex-1">
      <div
        className={
          'flex flex-col items-center justify-center gap-1.5 rounded-2xl text-[var(--accent-contrast)] [box-shadow:var(--shadow)] ' +
          (big ? 'py-7' : 'py-5')
        }
        style={{ background: variant === 'accent' ? 'var(--accent)' : 'var(--accent-2)' }}
      >
        <Icon size={big ? 28 : 22} />
        <span className={big ? 'text-base font-semibold' : 'text-sm font-medium'}>{label}</span>
      </div>
    </Link>
  )
}

export default function TodayScreen() {
  const { t } = useTranslation()
  const { isError } = useToday()
  const { data: profile } = useProfile()
  const { data: medications } = useMedications()
  const { data: routines } = useRoutines()
  const todayWeekday = new Date().getDay()
  const activeRoutines = (routines ?? []).filter((r) => {
    if (!r.active) return false
    const daysOfWeek = r.daysOfWeek as number[] | null
    return daysOfWeek == null || daysOfWeek.includes(todayWeekday)
  })
  const today = todayStr()
  const { data: workoutPrograms } = useWorkoutPrograms()
  const { data: workoutLogsToday } = useWorkoutLogs({ from: today, to: today })
  const doneWorkoutDayIdsToday = new Set((workoutLogsToday ?? []).map((l) => l.workoutDayId))
  const todaysWorkoutDays = (workoutPrograms ?? [])
    .filter((p) => p.active)
    .flatMap((p) =>
      p.days
        .filter((d) => ((d.daysOfWeek as number[] | null) ?? []).includes(todayWeekday))
        .map((d) => ({ program: p, day: d })),
    )
  const [formState, setFormState] = useState<'closed' | 'create' | Medication>('closed')

  function openEdit(medicationId: number) {
    const med = medications?.find((m) => m.id === medicationId)
    if (med) setFormState(med)
  }

  const workoutItems: WorkoutTodayItem[] = todaysWorkoutDays.map(({ program, day }) => ({
    key: `w-${day.id}`,
    program,
    day,
    done: doneWorkoutDayIdsToday.has(day.id),
  }))

  const hasNoMedsAtAll = medications != null && medications.length === 0

  return (
    <div>
      <WelcomeBanner />

      {isError && <EmptyState>{t('today.loadError')}</EmptyState>}

      {hasNoMedsAtAll && formState === 'closed' && (
        <div className="mb-4 space-y-2">
          <AddDoseButton prominent onClick={() => setFormState('create')} />
          {profile?.notOnMedsYet && (
            <p className="text-center text-xs text-[var(--text-muted)]">{t('today.noPressure')}</p>
          )}
        </div>
      )}

      {!hasNoMedsAtAll && formState === 'closed' && (
        <div className="mb-4 space-y-2">
          <MedicationsCarousel onEdit={openEdit} />
          <div className="flex items-center justify-between px-0.5">
            <button onClick={() => setFormState('create')} className="text-xs text-[var(--accent)]">
              {t('today.addMedication')}
            </button>
            <Link to="/medications" className="text-xs text-[var(--accent)]">
              {t('today.manageHistory')}
            </Link>
          </div>
        </div>
      )}

      {formState !== 'closed' && (
        <div className="mb-4">
          <MedicationForm
            medication={formState === 'create' ? undefined : formState}
            onDone={() => setFormState('closed')}
          />
        </div>
      )}

      {workoutItems.length > 0 && (
        <div className="mt-5">
          <WorkoutTodayCarousel items={workoutItems} />
        </div>
      )}

      {activeRoutines.length > 0 && (
        <div className="mt-5">
          <RoutinesTodayList routines={activeRoutines} />
        </div>
      )}

      <div className="mt-5">
        <TipOfDayCard />
      </div>

      <div className="mt-1">
        <BigLinkButton to="/dia" icon={Heart} label={t('today.registerDay')} variant="accent" big />
      </div>
      <div className="mt-2">
        <BigLinkButton to="/routines" icon={ListChecks} label={t('today.createRoutine')} variant="outline" state={{ create: true }} />
      </div>
    </div>
  )
}
