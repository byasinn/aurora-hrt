import { useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Check, Plus, Pencil, Undo2, PlayCircle } from '../../components/icons'
import { Button, Card, EmptyState } from '../../components/ui'
import RestTimer from '../../components/RestTimer'
import PinterestEmbed from '../../components/PinterestEmbed'
import IconOrEmoji from '../../components/IconOrEmoji'
import { resolveProgramIcon } from '../../lib/workoutTemplates'
import { weekdayLabel, todayStr } from '../../lib/dateUtils'
import { useWorkoutPrograms, useWorkoutLogs, useLogWorkout, useUnlogWorkout } from '../../api/workouts'
import type { WorkoutExercise, WorkoutExerciseLog, WorkoutSetEntry } from '../../../shared/types'
import { playSound } from '../../lib/sounds'

const DEFAULT_REST_SECONDS = 90

type SetRow = WorkoutSetEntry
interface ExerciseState {
  name: string
  sets: SetRow[]
}

const emptySet = (): SetRow => ({ weight: null, reps: null, done: false })

function planToState(exercises: WorkoutExercise[]): ExerciseState[] {
  return exercises.map((ex) => ({ name: ex.name, sets: Array.from({ length: Math.max(1, ex.sets) }, emptySet) }))
}

function logToState(exercises: WorkoutExercise[], setLogs: WorkoutExerciseLog[]): ExerciseState[] {
  const byName = new Map(setLogs.map((e) => [e.name, e.sets]))
  return exercises.map((ex) => ({ name: ex.name, sets: byName.get(ex.name) ?? Array.from({ length: Math.max(1, ex.sets) }, emptySet) }))
}

// Sem kg e repetição: cada exercício é o nome + uma bolinha por série pra ir marcando.
function ExerciseLogger({
  exercise,
  pinterestUrl,
  onChange,
}: {
  exercise: ExerciseState
  pinterestUrl?: string | null
  onChange: (next: ExerciseState) => void
}) {
  const [videoOpen, setVideoOpen] = useState(false)
  const allDone = exercise.sets.length > 0 && exercise.sets.every((s) => s.done)

  function toggleSet(i: number) {
    onChange({ ...exercise, sets: exercise.sets.map((s, idx) => (idx === i ? { ...s, done: !s.done } : s)) })
  }

  return (
    <Card className={'space-y-2.5 ' + (allDone ? 'border-[var(--accent)]' : '')}>
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 text-sm font-semibold text-[var(--text)]">{exercise.name}</p>
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
      <div className="flex flex-wrap items-center gap-2">
        {exercise.sets.map((s, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Série ${i + 1}${s.done ? ' (feita)' : ''}`}
            onClick={() => toggleSet(i)}
            className={
              'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition ' +
              (s.done ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]' : 'border-[var(--border)] text-[var(--text-muted)]')
            }
          >
            {s.done ? <Check size={15} /> : i + 1}
          </button>
        ))}
        <button
          type="button"
          aria-label="Adicionar série"
          onClick={() => onChange({ ...exercise, sets: [...exercise.sets, emptySet()] })}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-[var(--border)] text-[var(--text-muted)]"
        >
          <Plus size={14} />
        </button>
      </div>
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

  const program = programs?.find((p) => p.days.some((d) => d.id === dayId))
  const day = program?.days.find((d) => d.id === dayId)
  const todayLog = (logsToday ?? []).find((l) => l.workoutDayId === dayId)
  const plan = useMemo(() => (day?.exercises as WorkoutExercise[] | null) ?? [], [day])

  const [editing, setEditing] = useState(!todayLog)
  const [exercises, setExercises] = useState<ExerciseState[]>(() =>
    todayLog ? logToState(plan, (todayLog.setLogs as WorkoutExerciseLog[] | null) ?? []) : planToState(plan),
  )
  const [notes, setNotes] = useState(todayLog?.notes ?? '')
  // abrindo direto (recarregar, link) os dados chegam depois do primeiro render — sem isso o estado
  // nascia vazio e ficava "esse dia ainda não tem exercícios". Reinicia quando o treino ou o registro
  // de hoje mudam (concluiu, desfez).
  const loadedKey = `${day?.id ?? ''}:${todayLog?.id ?? ''}:${plan.length}`
  const [stateKey, setStateKey] = useState(loadedKey)
  if (stateKey !== loadedKey) {
    setStateKey(loadedKey)
    setExercises(todayLog ? logToState(plan, (todayLog.setLogs as WorkoutExerciseLog[] | null) ?? []) : planToState(plan))
    setNotes(todayLog?.notes ?? '')
    setEditing(!todayLog)
  }
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
    // concluir o treino = todas as séries feitas
    const setLogs: WorkoutExerciseLog[] = exercises.map((e) => ({ name: e.name, sets: e.sets.map((set) => ({ ...set, done: true })) }))
    const durationSeconds = sessionStartRef.current ? Math.round((Date.now() - sessionStartRef.current) / 1000) : null
    await logWorkout.mutateAsync({ workoutDayId: dayId, date: today, durationSeconds, notes: notes.trim() || null, setLogs })
    setExercises((cur) => cur.map((e) => ({ ...e, sets: e.sets.map((set) => ({ ...set, done: true })) })))
    playSound('success')
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
            {todayLog.durationSeconds != null && todayLog.durationSeconds >= 60 && <span>{Math.round(todayLog.durationSeconds / 60)}min</span>}
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
