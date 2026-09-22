import { useState, type FormEvent } from 'react'
import { BookOpen, Link2, Plus, Trash2 } from 'lucide-react'
import { Button, Card } from '../../components/ui'
import { useCreateWorkoutProgram, useUpdateWorkoutProgram } from '../../api/workouts'
import { ROUTINE_ICON_OPTIONS, DEFAULT_ROUTINE_ICON_KEY } from '../../lib/routineIcons'
import { weekdayLabel } from '../../lib/dateUtils'
import { MUSCLE_GROUP_LABELS, searchExerciseLibrary, type MuscleGroup } from '../../lib/exerciseLibrary'
import type { WorkoutDayInput, WorkoutExercise, WorkoutProgramDetail } from '../../../shared/types'

function emptyDay(name: string): WorkoutDayInput {
  return { name, daysOfWeek: [1, 3, 5], exercises: [] }
}

const MUSCLE_GROUPS = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]

function ExerciseLibraryPicker({ onPick, onClose }: { onPick: (name: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<MuscleGroup | null>(null)
  const results = searchExerciseLibrary(query, group)

  return (
    <Card className="space-y-2 bg-[var(--surface)]">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar exercício…"
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
      />
      <div className="flex flex-wrap gap-1.5">
        {MUSCLE_GROUPS.map((g) => (
          <button
            type="button"
            key={g}
            onClick={() => setGroup((cur) => (cur === g ? null : g))}
            className={
              'rounded-full border px-2 py-0.5 text-[11px] transition ' +
              (group === g
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'border-[var(--border)] text-[var(--text-muted)]')
            }
          >
            {MUSCLE_GROUP_LABELS[g]}
          </button>
        ))}
      </div>
      <div className="max-h-40 space-y-1 overflow-y-auto">
        {results.map((r) => (
          <button
            type="button"
            key={r.name}
            onClick={() => onPick(r.name)}
            className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-[var(--text)] hover:bg-[var(--surface-2)]"
          >
            {r.name}
          </button>
        ))}
        {results.length === 0 && <p className="px-2 py-1.5 text-xs text-[var(--text-muted)]">Nada encontrado.</p>}
      </div>
      <button type="button" onClick={onClose} className="w-full text-center text-[11px] text-[var(--text-muted)]">
        Fechar
      </button>
    </Card>
  )
}

function ExerciseRow({
  exercise,
  onChange,
  onRemove,
}: {
  exercise: WorkoutExercise
  onChange: (next: WorkoutExercise) => void
  onRemove: () => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(!!exercise.pinterestUrl)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <input
          value={exercise.name}
          onChange={(e) => onChange({ ...exercise, name: e.target.value })}
          placeholder="Exercício"
          className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          className={
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ' +
            (pickerOpen ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)]')
          }
        >
          <BookOpen size={12} />
        </button>
        <button
          type="button"
          onClick={() => setLinkOpen((o) => !o)}
          className={
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ' +
            (linkOpen || exercise.pinterestUrl
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-[var(--border)] text-[var(--text-muted)]')
          }
        >
          <Link2 size={12} />
        </button>
        <input
          type="number"
          min={1}
          value={exercise.sets}
          onChange={(e) => onChange({ ...exercise, sets: Number(e.target.value) })}
          className="w-12 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-1.5 text-center text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <input
          value={exercise.reps}
          onChange={(e) => onChange({ ...exercise, reps: e.target.value })}
          placeholder="reps"
          className="w-20 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-1.5 text-center text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <button type="button" onClick={onRemove} className="shrink-0 text-[var(--text-muted)]">
          <Trash2 size={14} />
        </button>
      </div>
      {pickerOpen && (
        <ExerciseLibraryPicker
          onPick={(name) => {
            onChange({ ...exercise, name })
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
      {linkOpen && (
        <input
          value={exercise.pinterestUrl ?? ''}
          onChange={(e) => onChange({ ...exercise, pinterestUrl: e.target.value || null })}
          placeholder="Link do Pinterest (pin ou pasta) — vídeo/foto de referência"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
      )}
    </div>
  )
}

function DayEditor({
  day,
  onChange,
  onRemove,
  removable,
}: {
  day: WorkoutDayInput
  onChange: (next: WorkoutDayInput) => void
  onRemove: () => void
  removable: boolean
}) {
  function toggleDay(d: number) {
    onChange({
      ...day,
      daysOfWeek: day.daysOfWeek.includes(d) ? day.daysOfWeek.filter((x) => x !== d) : [...day.daysOfWeek, d].sort(),
    })
  }

  function updateExercise(i: number, next: WorkoutExercise) {
    onChange({ ...day, exercises: day.exercises.map((e, idx) => (idx === i ? next : e)) })
  }

  function addExercise() {
    onChange({ ...day, exercises: [...day.exercises, { name: '', sets: 3, reps: '12' }] })
  }

  function removeExercise(i: number) {
    onChange({ ...day, exercises: day.exercises.filter((_, idx) => idx !== i) })
  }

  return (
    <Card className="space-y-3 bg-[var(--surface-2)]">
      <div className="flex items-center gap-2">
        <input
          value={day.name}
          onChange={(e) => onChange({ ...day, name: e.target.value })}
          placeholder="Nome do dia"
          className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        {removable && (
          <button type="button" onClick={onRemove} className="shrink-0 text-[var(--text-muted)]">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
          <button
            type="button"
            key={d}
            onClick={() => toggleDay(d)}
            className={
              'rounded-lg border px-2 py-1 text-xs transition ' +
              (day.daysOfWeek.includes(d)
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]')
            }
          >
            {weekdayLabel(d)}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        {day.exercises.map((ex, i) => (
          <ExerciseRow key={i} exercise={ex} onChange={(next) => updateExercise(i, next)} onRemove={() => removeExercise(i)} />
        ))}
        <button
          type="button"
          onClick={addExercise}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] py-1.5 text-xs text-[var(--text-muted)]"
        >
          <Plus size={12} /> Exercício
        </button>
      </div>
    </Card>
  )
}

export default function WorkoutProgramForm({ program, onDone }: { program?: WorkoutProgramDetail; onDone: () => void }) {
  const isEdit = !!program
  const createProgram = useCreateWorkoutProgram()
  const updateProgram = useUpdateWorkoutProgram()

  const [name, setName] = useState(program?.name ?? '')
  const [icon, setIcon] = useState(program?.icon ?? DEFAULT_ROUTINE_ICON_KEY)
  const [days, setDays] = useState<WorkoutDayInput[]>(
    program?.days.map((d) => ({
      name: d.name,
      daysOfWeek: (d.daysOfWeek as number[] | null) ?? [],
      exercises: (d.exercises as WorkoutExercise[] | null) ?? [],
    })) ?? [emptyDay('Dia 1')],
  )

  function updateDay(i: number, next: WorkoutDayInput) {
    setDays((cur) => cur.map((d, idx) => (idx === i ? next : d)))
  }

  function addDay() {
    setDays((cur) => [...cur, emptyDay(`Dia ${cur.length + 1}`)])
  }

  function removeDay(i: number) {
    setDays((cur) => cur.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || days.length === 0) return
    const cleanDays = days.map((d) => ({ ...d, exercises: d.exercises.filter((ex) => ex.name.trim()) }))

    if (isEdit) {
      await updateProgram.mutateAsync({ id: program.id, name, icon, days: cleanDays })
    } else {
      await createProgram.mutateAsync({ name, icon, days: cleanDays })
    }
    onDone()
  }

  return (
    <Card className="space-y-4">
      <h2 className="text-base font-semibold text-[var(--text)]">{isEdit ? 'Editar treino' : 'Novo treino'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Nome do programa</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Meu treino de força"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Ícone</label>
          <div className="flex flex-wrap gap-2">
            {ROUTINE_ICON_OPTIONS.map(({ key, Icon }) => (
              <button
                type="button"
                key={key}
                onClick={() => setIcon(key)}
                className={
                  'flex h-10 w-10 items-center justify-center rounded-full border ' +
                  (icon === key
                    ? 'border-[var(--accent)] bg-[var(--surface-2)] text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-muted)]')
                }
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-[var(--text-muted)]">Dias de treino</label>
          {days.map((d, i) => (
            <DayEditor
              key={i}
              day={d}
              onChange={(next) => updateDay(i, next)}
              onRemove={() => removeDay(i)}
              removable={days.length > 1}
            />
          ))}
          <button
            type="button"
            onClick={addDay}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--border)] py-2 text-xs text-[var(--text-muted)]"
          >
            <Plus size={14} /> Adicionar dia
          </button>
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={createProgram.isPending || updateProgram.isPending}>
            Salvar
          </Button>
        </div>
      </form>
    </Card>
  )
}
