import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Heart, ListChecks, History } from '../../components/icons'
import { EmptyState } from '../../components/ui'
import AppIcon from '../../components/AppIcon'
import type { PixelIconName } from '../../components/PixelIcon'
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
import Guide from '../../components/Guide'

function AddDoseButton({ prominent, onClick }: { prominent: boolean; onClick: () => void }) {
  const { t } = useTranslation()
  if (prominent) {
    return (
      <button
        onClick={onClick}
        className="btn-press flex w-full flex-col items-center justify-center gap-1.5 rounded-3xl py-6 text-[var(--accent-contrast)]"
        style={{ background: 'var(--accent)' }}
      >
        <Plus size={24} />
        <span className="text-base font-bold">{t('today.addDose')}</span>
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border)] text-sm font-bold text-[var(--text-muted)]"
    >
      <Plus size={16} />
      {t('today.addDose')}
    </button>
  )
}

function BigLinkButton({
  to,
  icon: Icon,
  pixel,
  label,
  variant,
  state,
  big,
}: {
  to: string
  icon: typeof Heart
  pixel?: PixelIconName
  label: string
  variant: 'accent' | 'accent2' | 'outline'
  state?: unknown
  big?: boolean
}) {
  if (variant === 'outline') {
    return (
      <Link to={to} state={state} className="flex-1">
        <div className="flex min-h-13 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border)] text-[15px] text-[var(--text-muted)]">
          <AppIcon icon={Icon} pixel={pixel} size={18} />
          <span className="font-bold">{label}</span>
        </div>
      </Link>
    )
  }
  return (
    <Link to={to} state={state} className="flex-1">
      <div
        className={
          'btn-press flex flex-col items-center justify-center gap-1.5 rounded-3xl text-[var(--accent-contrast)] ' +
          (big ? 'py-7' : 'py-5')
        }
        style={
          variant === 'accent'
            ? { background: 'var(--accent)' }
            : ({ background: 'var(--accent-2)', '--press-shadow': 'color-mix(in srgb, var(--accent-2) 55%, #000)' } as React.CSSProperties)
        }
      >
        <AppIcon icon={Icon} pixel={pixel} size={big ? 28 : 22} />
        <span className={big ? 'text-lg font-extrabold' : 'text-[15px] font-bold'}>{label}</span>
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
      <Guide
        id="home-1.3"
        steps={[
          { target: 'aurora-button', title: 'A central do Aurora', text: 'Missões, baús, lojinha, Comunidade, pontos e personalizar app — tudo aqui.' },
          { target: 'register-day', title: 'Registrar dia vale Brilho', text: 'Humor, energia, libido, sintomas e notas: quanto mais detalhe, mais Brilho.' },
          { target: 'routine-check', title: 'Marcou no dia, valeu', text: 'Rotina marcada no dia vale Brilho. Esqueceu? No dia seguinte o app pergunta.' },
          { target: 'desktop-rail', title: 'Seu resumo sempre à vista', text: 'Streak, Brilho, poções e recompensas pra pegar, aqui do lado.' },
        ]}
      />
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
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFormState('create')}
              className="btn-press-soft flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-bold text-[var(--text)]"
            >
              <Plus size={16} className="text-[var(--accent)]" />
              {t('today.addMedication')}
            </button>
            <Link
              to="/medications"
              className="btn-press-soft flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-bold text-[var(--text)]"
            >
              <History size={16} className="text-[var(--accent)]" />
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

      <div className="mt-5" data-guide="register-day">
        <BigLinkButton to="/dia" icon={Heart} pixel="health" label={t('today.registerDay')} variant="accent" big />
      </div>
      <div className="mt-2">
        <BigLinkButton to="/routines" icon={ListChecks} pixel="checklist" label={t('today.createRoutine')} variant="outline" state={{ create: true }} />
      </div>

      <div className="mt-5 empty:hidden">
        <TipOfDayCard />
      </div>
    </div>
  )
}
