import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button, Card, EmptyState, ScreenTitle } from '../../components/ui'
import { useCreateTask } from '../../api/tasks'
import { useCreateRoutine } from '../../api/routines'
import { weekdayLabel } from '../../lib/dateUtils'
import type { RoutineType } from '../../../shared/types'

const TASK_IDEAS = [
  { title: 'Sessão de masturbação', icon: '🔥' },
  { title: 'Edging', icon: '⏳' },
  { title: 'CEI', icon: '🥛' },
]

const ROUTINE_IDEAS: { name: string; icon: string; type: RoutineType }[] = [
  { name: 'Treino de resistência', icon: '💪', type: 'timer' },
  { name: 'Explorar o corpo', icon: '✋', type: 'counter' },
  { name: 'Momento a sós', icon: '❤️', type: 'checkbox' },
  { name: 'CEI diário', icon: '🥛', type: 'checkbox' },
]

function RoutineIdeaForm({
  initial,
  onDone,
}: {
  initial: { name: string; icon: string; type: RoutineType }
  onDone: () => void
}) {
  const createRoutine = useCreateRoutine()
  const [everyDay, setEveryDay] = useState(true)
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5])

  function toggleDay(d: number) {
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await createRoutine.mutateAsync({
      name: initial.name,
      icon: initial.icon,
      type: initial.type,
      targetCount: initial.type === 'counter' ? 8 : initial.type === 'timer' ? 300 : null,
      daysOfWeek: everyDay ? null : days,
      active: true,
    })
    onDone()
  }

  return (
    <Card className="space-y-3">
      <p className="text-sm font-medium text-[var(--text)]">
        {initial.icon} {initial.name}
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Quando aparece na Home</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEveryDay(true)}
              className={
                'flex-1 rounded-xl border px-2 py-2 text-xs transition ' +
                (everyDay
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]')
              }
            >
              Todo dia
            </button>
            <button
              type="button"
              onClick={() => setEveryDay(false)}
              className={
                'flex-1 rounded-xl border px-2 py-2 text-xs transition ' +
                (!everyDay
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]')
              }
            >
              Dias específicos
            </button>
          </div>
          {!everyDay && (
            <div className="mt-2 flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={
                    'rounded-lg border px-2.5 py-1.5 text-xs transition ' +
                    (days.includes(d)
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                      : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]')
                  }
                >
                  {weekdayLabel(d)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={createRoutine.isPending}>
            Criar rotina
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default function MasturbacaoScreen() {
  const createTask = useCreateTask()
  const [routineIdea, setRoutineIdea] = useState<{ name: string; icon: string; type: RoutineType } | null>(null)
  const [justCreated, setJustCreated] = useState<string | null>(null)

  async function quickCreateTask(idea: { title: string; icon: string }) {
    await createTask.mutateAsync({ title: idea.title, icon: idea.icon, done: false })
    setJustCreated(idea.title)
    setTimeout(() => setJustCreated(null), 2500)
  }

  return (
    <div className="space-y-4">
      <Link to="/kink" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ChevronLeft size={16} /> Kink
      </Link>
      <ScreenTitle>Masturbação</ScreenTitle>

      {justCreated && (
        <p className="rounded-xl border border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--accent)]">
          "{justCreated}" criada — aparece na Home hoje.
        </p>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--text-muted)]">Tarefas de hoje</p>
        <div className="flex flex-wrap gap-2">
          {TASK_IDEAS.map((idea) => (
            <button
              key={idea.title}
              onClick={() => quickCreateTask(idea)}
              disabled={createTask.isPending}
              className="rounded-full border border-dashed border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-muted)]"
            >
              {idea.icon} {idea.title}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--text-muted)]">Rotinas (com dias da semana)</p>
        {routineIdea ? (
          <RoutineIdeaForm initial={routineIdea} onDone={() => setRoutineIdea(null)} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {ROUTINE_IDEAS.map((idea) => (
              <button
                key={idea.name}
                onClick={() => setRoutineIdea(idea)}
                className="rounded-full border border-dashed border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-muted)]"
              >
                {idea.icon} {idea.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {!routineIdea && (
        <EmptyState>
          Toque numa ideia acima pra criar rápido, ou crie e edite tudo em{' '}
          <Link to="/routines" className="text-[var(--accent)]">
            Rotinas
          </Link>
          .
        </EmptyState>
      )}
    </div>
  )
}
