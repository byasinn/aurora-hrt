import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ChevronRight, Flame, History, Pencil, Plus, Trash2, Trophy } from 'lucide-react'
import { Button, Card, EmptyState, ScreenTitle } from '../../components/ui'
import Switch from '../../components/Switch'
import IconOrEmoji from '../../components/IconOrEmoji'
import { weekdayLabel, todayStr } from '../../lib/dateUtils'
import { WORKOUT_TEMPLATES, resolveProgramIcon } from '../../lib/workoutTemplates'
import {
  useWorkoutPrograms,
  useCreateWorkoutProgram,
  useUpdateWorkoutProgram,
  useDeleteWorkoutProgram,
  useWorkoutLogs,
} from '../../api/workouts'
import { useWorkoutStats } from './useWorkoutStats'
import WorkoutProgramForm from './WorkoutProgramForm'
import type { WorkoutDay, WorkoutProgramDetail } from '../../../shared/types'

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-lg font-semibold text-[var(--text)]">{value}</p>
      <p className="text-[11px] text-[var(--text-muted)]">{label}</p>
    </div>
  )
}

function WeeklyChart({ counts }: { counts: number[] }) {
  const max = Math.max(1, ...counts)
  const ordered = [...counts].reverse() // mais antiga primeiro, essa semana por último
  return (
    <div className="flex items-end gap-1.5" style={{ height: 48 }}>
      {ordered.map((c, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1" style={{ height: '100%' }}>
          <div
            className="w-full rounded-sm bg-[var(--accent)]"
            style={{ height: `${(c / max) * 100}%`, minHeight: c > 0 ? 3 : 1, opacity: c > 0 ? 1 : 0.2 }}
          />
        </div>
      ))}
    </div>
  )
}

function DashboardCard() {
  const stats = useWorkoutStats()
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Flame size={14} className="text-[var(--accent)]" />
          <p className="text-xs font-medium text-[var(--text-muted)]">Seu progresso</p>
        </div>
        <Link to="/treinos/historico" className="flex items-center gap-1 text-xs text-[var(--accent)]">
          <History size={12} /> Histórico
        </Link>
      </div>
      <div className="flex">
        <StatTile label="sessões" value={String(stats.sessionsCount)} />
        <StatTile label="sequência" value={`${stats.currentStreakDays}d`} />
        <StatTile label="essa semana" value={String(stats.thisWeekSessionsCount)} />
        <StatTile label="volume total" value={`${Math.round(stats.totalVolume)}kg`} />
      </div>
      <WeeklyChart counts={stats.weeklySessionCounts} />
      {stats.prsByExercise.size > 0 && (
        <div className="flex items-center gap-1.5 border-t border-[var(--border)] pt-2 text-xs text-[var(--text-muted)]">
          <Trophy size={12} className="text-amber-500" />
          {stats.prsByExercise.size} recorde{stats.prsByExercise.size === 1 ? '' : 's'} pessoa
          {stats.prsByExercise.size === 1 ? 'l' : 'is'}
        </div>
      )}
    </Card>
  )
}

function DayRow({ day, doneToday }: { day: WorkoutDay; doneToday: boolean }) {
  const daysOfWeek = (day.daysOfWeek as number[] | null) ?? []
  const exercises = (day.exercises as unknown[] | null) ?? []
  return (
    <Link
      to={`/treinos/dia/${day.id}`}
      className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[var(--text)]">{day.name}</p>
        <p className="text-[11px] text-[var(--text-muted)]">
          {daysOfWeek.map(weekdayLabel).join(', ') || 'sem dia definido'} · {exercises.length} exercício
          {exercises.length === 1 ? '' : 's'}
        </p>
      </div>
      {doneToday && <CheckCircle2 size={16} className="shrink-0 text-[var(--accent)]" />}
      <ChevronRight size={16} className="shrink-0 text-[var(--text-muted)]" />
    </Link>
  )
}

function ProgramCard({
  program,
  doneDayIdsToday,
  onEdit,
}: {
  program: WorkoutProgramDetail
  doneDayIdsToday: Set<number>
  onEdit: () => void
}) {
  const updateProgram = useUpdateWorkoutProgram()
  const deleteProgram = useDeleteWorkoutProgram()

  function handleDelete() {
    if (confirm(`Excluir o treino "${program.name}"? Isso remove os dias e o histórico dele.`)) {
      deleteProgram.mutate(program.id)
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <IconOrEmoji icon={resolveProgramIcon(program)} size={20} className="shrink-0 text-[var(--accent)]" />
        <p className="min-w-0 flex-1 truncate font-medium text-[var(--text)]">{program.name}</p>
        <Switch checked={program.active} onChange={(v) => updateProgram.mutate({ id: program.id, active: v })} />
        <button onClick={onEdit} className="shrink-0 text-[var(--text-muted)]">
          <Pencil size={14} />
        </button>
        <button onClick={handleDelete} className="shrink-0 text-[var(--text-muted)]">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="space-y-1.5">
        {program.days.map((d) => (
          <DayRow key={d.id} day={d} doneToday={doneDayIdsToday.has(d.id)} />
        ))}
      </div>
    </Card>
  )
}

function TemplatePicker({ onCreateCustom, onDone }: { onCreateCustom: () => void; onDone: () => void }) {
  const createProgram = useCreateWorkoutProgram()

  async function handlePick(templateKey: string) {
    const template = WORKOUT_TEMPLATES.find((t) => t.key === templateKey)
    if (!template) return
    await createProgram.mutateAsync({
      name: template.title,
      icon: template.icon,
      templateKey: template.key,
      days: [{ name: template.title, daysOfWeek: template.daysOfWeek, exercises: template.exercises }],
    })
    onDone()
  }

  return (
    <Card className="space-y-3">
      <h2 className="text-base font-semibold text-[var(--text)]">Novo treino</h2>
      <p className="text-xs text-[var(--text-muted)]">Escolha um treino pronto ou monte o seu do zero.</p>
      <div className="grid grid-cols-2 gap-2">
        {WORKOUT_TEMPLATES.map((t) => {
          return (
            <button
              key={t.key}
              type="button"
              disabled={createProgram.isPending}
              onClick={() => handlePick(t.key)}
              className="flex flex-col items-start gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-left disabled:opacity-50"
            >
              <IconOrEmoji icon={t.icon} size={18} className="text-[var(--accent)]" />
              <span className="text-sm font-medium text-[var(--text)]">{t.title}</span>
              <span className="text-[11px] text-[var(--text-muted)]">{t.focus}</span>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={onCreateCustom}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--border)] py-2.5 text-sm text-[var(--text-muted)]"
      >
        <Plus size={14} /> Criar do zero
      </button>
      <Button type="button" variant="secondary" className="w-full" onClick={onDone}>
        Cancelar
      </Button>
    </Card>
  )
}

export default function WorkoutsScreen() {
  const { data: programs, isLoading } = useWorkoutPrograms()
  const today = todayStr()
  const { data: logsToday } = useWorkoutLogs({ from: today, to: today })
  const [mode, setMode] = useState<'closed' | 'picker' | 'form'>('closed')
  const [editingProgram, setEditingProgram] = useState<WorkoutProgramDetail | undefined>(undefined)

  const doneDayIdsToday = new Set((logsToday ?? []).map((l) => l.workoutDayId))

  function openCreate() {
    setEditingProgram(undefined)
    setMode('picker')
  }

  function openEdit(program: WorkoutProgramDetail) {
    setEditingProgram(program)
    setMode('form')
  }

  function close() {
    setMode('closed')
    setEditingProgram(undefined)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ScreenTitle>Treinos</ScreenTitle>
        {mode === 'closed' && (
          <button
            onClick={openCreate}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {mode === 'picker' && <TemplatePicker onCreateCustom={() => setMode('form')} onDone={close} />}
      {mode === 'form' && <WorkoutProgramForm program={editingProgram} onDone={close} />}

      {mode === 'closed' && programs && programs.length > 0 && <DashboardCard />}

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}

      {mode === 'closed' && programs && programs.length === 0 && (
        <EmptyState>Nenhum treino ainda. Toque no + pra criar um pronto ou do zero.</EmptyState>
      )}

      {mode === 'closed' && (
        <div className="space-y-3">
          {programs?.map((p) => (
            <ProgramCard key={p.id} program={p} doneDayIdsToday={doneDayIdsToday} onEdit={() => openEdit(p)} />
          ))}
        </div>
      )}
    </div>
  )
}
