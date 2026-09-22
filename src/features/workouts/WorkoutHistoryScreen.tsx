import { Link } from 'react-router-dom'
import { ArrowLeft, Trophy } from 'lucide-react'
import { Card, EmptyState, ScreenTitle } from '../../components/ui'
import IconOrEmoji from '../../components/IconOrEmoji'
import { formatDateBR } from '../../lib/dateUtils'
import { resolveProgramIcon } from '../../lib/workoutTemplates'
import { useWorkoutPrograms, useWorkoutLogs } from '../../api/workouts'
import type { WorkoutExerciseLog } from '../../../shared/types'

export default function WorkoutHistoryScreen() {
  const { data: programs } = useWorkoutPrograms()
  const { data: logs, isLoading } = useWorkoutLogs()

  const dayInfoById = new Map<number, { dayName: string; programName: string; icon: string }>()
  for (const p of programs ?? []) {
    for (const d of p.days) {
      dayInfoById.set(d.id, { dayName: d.name, programName: p.name, icon: resolveProgramIcon(p) })
    }
  }

  const sorted = [...(logs ?? [])].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-4">
      <Link to="/treinos" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ArrowLeft size={16} /> Treinos
      </Link>
      <ScreenTitle>Histórico de treinos</ScreenTitle>

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {sorted.length === 0 && !isLoading && <EmptyState>Nenhum treino concluído ainda.</EmptyState>}

      <div className="space-y-2">
        {sorted.map((log) => {
          const info = dayInfoById.get(log.workoutDayId)
          const setLogs = (log.setLogs as WorkoutExerciseLog[] | null) ?? []
          const doneSets = setLogs.reduce((sum, e) => sum + e.sets.filter((s) => s.done).length, 0)
          const volume = setLogs.reduce(
            (sum, e) => sum + e.sets.reduce((s, set) => s + (set.done && set.weight ? set.weight * (set.reps ?? 0) : 0), 0),
            0,
          )
          return (
            <Card key={log.id} className="space-y-1.5">
              <div className="flex items-center gap-2">
                {info && <IconOrEmoji icon={info.icon} size={16} className="shrink-0 text-[var(--accent)]" />}
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text)]">
                  {info?.dayName ?? 'Treino'}
                </p>
                <span className="shrink-0 text-xs text-[var(--text-muted)]">{formatDateBR(log.date)}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                {info?.programName}
                {doneSets > 0 && ` · ${doneSets} séries`}
                {volume > 0 && ` · ${Math.round(volume)}kg`}
                {log.durationSeconds != null && ` · ${Math.round(log.durationSeconds / 60)}min`}
              </p>
              {log.notes && <p className="text-sm text-[var(--text)]">{log.notes}</p>}
            </Card>
          )
        })}
      </div>

      {sorted.length > 0 && (
        <p className="flex items-center justify-center gap-1.5 pt-2 text-xs text-[var(--text-muted)]">
          <Trophy size={12} className="text-amber-500" />
          Continue treinando pra bater mais recordes.
        </p>
      )}
    </div>
  )
}
