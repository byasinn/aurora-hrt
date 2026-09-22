import { useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Check, Plus, Trophy, Undo2, Pencil, PlayCircle } from 'lucide-react'
import { Button, Card, EmptyState } from '../../components/ui'
import RestTimer from '../../components/RestTimer'
import PinterestEmbed from '../../components/PinterestEmbed'
import IconOrEmoji from '../../components/IconOrEmoji'
import { resolveProgramIcon } from '../../lib/workoutTemplates'
import { weekdayLabel, todayStr } from '../../lib/dateUtils'
import { useWorkoutPrograms, useWorkoutLogs, useLogWorkout, useUnlogWorkout } from '../../api/workouts'
import { useWorkoutStats } from './useWorkoutStats'
import type { WorkoutExercise, WorkoutExerciseLog, WorkoutSetEntry } from '../../../shared/types'

const DEFAULT_REST_SECONDS = 90

type SetRow = WorkoutSetEntry
interface ExerciseState {
  name: string
  targetSets: number
  targetReps: string
  sets: SetRow[]
}

function planToState(exercises: WorkoutExercise[]): ExerciseState[] {
  return exercises.map((ex) => ({
    name: ex.name,
    targetSets: ex.sets,
    targetReps: ex.reps,
    sets: Array.from({ length: ex.sets }, () => ({ weight: null, reps: null, done: false })),
  }))
}

function logToState(exercises: WorkoutExercise[], setLogs: WorkoutExerciseLog[]): ExerciseState[] {
  const byName = new Map(setLogs.map((e) => [e.name, e.sets]))
  return exercises.map((ex) => ({
    name: ex.name,
    targetSets: ex.sets,
    targetReps: ex.reps,
    sets: byName.get(ex.name) ?? Array.from({ length: ex.sets }, () => ({ weight: null, reps: null, done: false })),
  }))
}

function SetRowEditor({
  set,
  index,
  isPr,
  onChange,
}: {
  set: SetRow
  index: number
  isPr: boolean
  onChange: (next: SetRow) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 shrink-0 text-xs text-[var(--text-muted)]">{index + 1}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        placeholder="kg"
        value={set.weight ?? ''}
        onChange={(e) => onChange({ ...set, weight: e.target.value === '' ? null : Number(e.target.value) })}
        className="w-16 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-center text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
      />
      <span className="text-xs text-[var(--text-muted)]">×</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        placeholder="reps"
        value={set.reps ?? ''}
        onChange={(e) => onChange({ ...set, reps: e.target.value === '' ? null : Number(e.target.value) })}
        className="w-16 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-center text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
      />
      {isPr && set.done && <Trophy size={14} className="shrink-0 text-amber-500" />}
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => onChange({ ...set, done: !set.done })}
        className={
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ' +
          (set.done
            ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
            : 'border-[var(--border)] text-[var(--text-muted)]')
        }
      >
        <Check size={14} />
      </button>
    </div>
  )
}

function ExerciseLogger({
  exercise,
  prWeight,
  pinterestUrl,
  onChange,
}: {
  exercise: ExerciseState
  prWeight: number | undefined
  pinterestUrl?: string | null
  onChange: (next: ExerciseState) => void
}) {
  const [videoOpen, setVideoOpen] = useState(false)

  function updateSet(i: number, next: SetRow) {
    onChange({ ...exercise, sets: exercise.sets.map((s, idx) => (idx === i ? next : s)) })
  }
  function addSet() {
    onChange({ ...exercise, sets: [...exercise.sets, { weight: null, reps: null, done: false }] })
  }

  return (
    <Card className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--text)]">{exercise.name}</p>
          <p className="text-[11px] text-[var(--text-muted)]">
            Meta: {exercise.targetSets}x {exercise.targetReps}
          </p>
        </div>
        {pinterestUrl && (
          <button
            type="button"
            onClick={() => setVideoOpen((o) => !o)}
            className={
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ' +
              (videoOpen ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)]')
            }
          >
            <PlayCircle size={16} />
          </button>
        )}
      </div>
      {videoOpen && pinterestUrl && <PinterestEmbed url={pinterestUrl} />}
      <div className="space-y-1.5">
        {exercise.sets.map((s, i) => (
          <SetRowEditor
            key={i}
            set={s}
            index={i}
            isPr={prWeight != null && s.weight != null && s.weight > prWeight}
            onChange={(next) => updateSet(i, next)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={addSet}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] py-1.5 text-xs text-[var(--text-muted)]"
      >
        <Plus size={12} /> Série
      </button>
    </Card>
  )
}

export default function WorkoutDayScreen() {
  const { id } = useParams<{ id: string }>()
  const dayId = Number(id)
  const { data: programs, isLoading } = useWorkoutPrograms()
  const today = todayStr()
  const { data: logsToday } = useWorkoutLogs({ from: today, to: today })
  const logWorkout = useLogWorkout()
  const unlogWorkout = useUnlogWorkout()
  const stats = useWorkoutStats()

  const program = programs?.find((p) => p.days.some((d) => d.id === dayId))
  const day = program?.days.find((d) => d.id === dayId)
  const todayLog = (logsToday ?? []).find((l) => l.workoutDayId === dayId)
  const plan = useMemo(() => (day?.exercises as WorkoutExercise[] | null) ?? [], [day])

  const [editing, setEditing] = useState(!todayLog)
  const [exercises, setExercises] = useState<ExerciseState[]>(() =>
    todayLog ? logToState(plan, (todayLog.setLogs as WorkoutExerciseLog[] | null) ?? []) : planToState(plan),
  )
  const [notes, setNotes] = useState(todayLog?.notes ?? '')
  const [restFor, setRestFor] = useState<string | null>(null)
  const sessionStartRef = useRef<number | null>(null)

  const daysOfWeek = (day?.daysOfWeek as number[] | null) ?? []

  function updateExercise(i: number, next: ExerciseState) {
    const prevDoneCount = exercises[i].sets.filter((s) => s.done).length
    const nextDoneCount = next.sets.filter((s) => s.done).length
    if (sessionStartRef.current == null) sessionStartRef.current = Date.now()
    if (nextDoneCount > prevDoneCount) setRestFor(`${i}-${Date.now()}`)
    setExercises((cur) => cur.map((e, idx) => (idx === i ? next : e)))
  }

  async function handleFinish() {
    const setLogs: WorkoutExerciseLog[] = exercises.map((e) => ({ name: e.name, sets: e.sets }))
    const durationSeconds = sessionStartRef.current ? Math.round((Date.now() - sessionStartRef.current) / 1000) : null
    await logWorkout.mutateAsync({ workoutDayId: dayId, date: today, durationSeconds, notes: notes.trim() || null, setLogs })
    setRestFor(null)
    setEditing(false)
  }

  function handleUndo() {
    if (!confirm('Desfazer o treino de hoje? Os dados registrados serão apagados.')) return
    unlogWorkout.mutate({ workoutDayId: dayId, date: today })
    setExercises(planToState(plan))
    setNotes('')
    sessionStartRef.current = null
    setEditing(true)
  }

  if (isLoading) {
    return <p className="text-sm text-[var(--text-muted)]">Carregando…</p>
  }

  if (!day || !program) {
    return <EmptyState>Treino não encontrado.</EmptyState>
  }

  const totalSets = exercises.reduce((sum, e) => sum + e.sets.length, 0)
  const doneSets = exercises.reduce((sum, e) => sum + e.sets.filter((s) => s.done).length, 0)
  const sessionVolume = exercises.reduce(
    (sum, e) => sum + e.sets.reduce((s, set) => s + (set.done && set.weight ? set.weight * (set.reps ?? 0) : 0), 0),
    0,
  )
  const newPrCount = exercises.reduce((count, e) => {
    const pr = stats.prsByExercise.get(e.name)?.maxWeight
    return count + e.sets.filter((s) => s.done && s.weight != null && (pr == null || s.weight > pr)).length
  }, 0)

  return (
    <div className="space-y-4">
      <Link to="/treinos" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ArrowLeft size={16} /> Treinos
      </Link>

      <div className="flex items-center gap-2">
        <IconOrEmoji icon={resolveProgramIcon(program)} size={22} className="text-[var(--accent)]" />
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">{day.name}</h1>
          <p className="text-xs text-[var(--text-muted)]">
            {program.name} · {daysOfWeek.map(weekdayLabel).join(', ') || 'sem dia definido'}
          </p>
        </div>
      </div>

      {todayLog && !editing ? (
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <Check size={18} className="text-[var(--accent)]" />
            <p className="text-sm font-medium text-[var(--text)]">Treino concluído hoje</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
            <span>{doneSets}/{totalSets} séries</span>
            {sessionVolume > 0 && <span>{Math.round(sessionVolume)}kg de volume</span>}
            {todayLog.durationSeconds != null && <span>{Math.round(todayLog.durationSeconds / 60)}min</span>}
            {newPrCount > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <Trophy size={12} /> {newPrCount} recorde{newPrCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          {todayLog.notes && <p className="text-sm text-[var(--text)]">{todayLog.notes}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex flex-1 items-center justify-center gap-1.5" onClick={() => setEditing(true)}>
              <Pencil size={14} /> Editar
            </Button>
            <Button variant="secondary" className="flex flex-1 items-center justify-center gap-1.5" onClick={handleUndo}>
              <Undo2 size={14} /> Desfazer
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {exercises.map((ex, i) => (
              <ExerciseLogger
                key={i}
                exercise={ex}
                prWeight={stats.prsByExercise.get(ex.name)?.maxWeight}
                pinterestUrl={plan[i]?.pinterestUrl}
                onChange={(next) => updateExercise(i, next)}
              />
            ))}
            {exercises.length === 0 && <EmptyState>Esse dia ainda não tem exercícios.</EmptyState>}
          </div>

          {restFor && <RestTimer key={restFor} seconds={DEFAULT_REST_SECONDS} onDone={() => setRestFor(null)} />}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Como foi o treino?"
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          </div>

          <Button
            className="flex w-full items-center justify-center gap-2"
            onClick={handleFinish}
            disabled={logWorkout.isPending || exercises.length === 0}
          >
            <Check size={18} />
            Concluir treino
          </Button>
        </>
      )}
    </div>
  )
}
