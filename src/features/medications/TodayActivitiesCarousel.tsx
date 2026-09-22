import { Link } from 'react-router-dom'
import { ChevronRight, CheckCircle2 } from 'lucide-react'
import RoutineRow from '../routines/RoutineRow'
import IconOrEmoji from '../../components/IconOrEmoji'
import { resolveProgramIcon } from '../../lib/workoutTemplates'
import { useLogWorkout } from '../../api/workouts'
import { todayStr } from '../../lib/dateUtils'
import type { Routine, WorkoutProgramDetail, WorkoutDay } from '../../../shared/types'

export interface WorkoutTodayItem {
  key: string
  program: WorkoutProgramDetail
  day: WorkoutDay
  done: boolean
}

function WorkoutBigCard({ program, day, done }: { program: WorkoutProgramDetail; day: WorkoutDay; done: boolean }) {
  const logWorkout = useLogWorkout()
  const exercises = (day.exercises as unknown[] | null) ?? []

  return (
    <div
      className={
        'flex h-full flex-col justify-between gap-3 rounded-2xl border p-4 [box-shadow:var(--shadow)] ' +
        (done ? 'border-[var(--accent)] bg-[var(--surface)]' : 'border-[var(--border)] bg-[var(--surface)]')
      }
    >
      <Link to={`/treinos/dia/${day.id}`} className="flex items-start gap-3">
        <IconOrEmoji icon={resolveProgramIcon(program)} size={28} className="shrink-0 text-[var(--accent)]" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-[var(--text)]">{day.name}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {program.name} · {exercises.length} exercício{exercises.length === 1 ? '' : 's'}
          </p>
        </div>
      </Link>
      <div className="flex items-center justify-between">
        <Link to={`/treinos/dia/${day.id}`} className="flex items-center gap-1 text-xs text-[var(--accent)]">
          Ver treino <ChevronRight size={12} />
        </Link>
        <button
          onClick={() => !done && logWorkout.mutate({ workoutDayId: day.id, date: todayStr() })}
          disabled={done || logWorkout.isPending}
          className={
            'flex h-12 w-12 items-center justify-center rounded-full border transition ' +
            (done
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
              : 'border-[var(--border)] text-[var(--text-muted)]')
          }
        >
          <CheckCircle2 size={20} />
        </button>
      </div>
    </div>
  )
}

/** Carrossel horizontal só de treinos de hoje — ocupa a tela toda com 1 item, mostra beiradinha com 2+. */
export function WorkoutTodayCarousel({ items }: { items: WorkoutTodayItem[] }) {
  if (items.length === 0) return null
  const cardWidth = items.length === 1 ? 'w-full' : 'w-[82%]'

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] snap-x snap-mandatory">
      {items.map((item) => (
        <div key={item.key} className={`${cardWidth} min-h-[132px] shrink-0 snap-center`}>
          <WorkoutBigCard program={item.program} day={item.day} done={item.done} />
        </div>
      ))}
    </div>
  )
}

/** Lista empilhada de rotinas de hoje — cada uma na sua própria linha, não divide espaço com os treinos. */
export function RoutinesTodayList({ routines }: { routines: Routine[] }) {
  if (routines.length === 0) return null

  return (
    <div className="space-y-2">
      {routines.map((routine) => (
        <RoutineRow key={routine.id} routine={routine} big />
      ))}
    </div>
  )
}
