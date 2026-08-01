import { useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Trash2, Check } from 'lucide-react'
import { Card, EmptyState, ScreenTitle } from '../../components/ui'
import { useRoutines } from '../../api/routines'
import { useProfile } from '../../api/profile'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../../api/tasks'
import RoutineForm from './RoutineForm'
import RoutineRow from './RoutineRow'
import type { Routine } from '../../../shared/types'

function TasksSection() {
  const { data: tasks } = useTasks()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const [title, setTitle] = useState('')

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    createTask.mutate({ title: title.trim(), icon: '⚠️', done: false })
    setTitle('')
  }

  const pending = tasks?.filter((t) => !t.done) ?? []
  const done = tasks?.filter((t) => t.done) ?? []

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-sm font-medium text-[var(--text)]">Punições / tarefas avulsas</h2>
        <p className="text-xs text-[var(--text-muted)]">
          Aparecem na Home até serem concluídas — não são recorrentes como as rotinas.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: 20 flexões, escrever uma linha…"
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={createTask.isPending || !title.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] disabled:opacity-50"
        >
          <Plus size={16} />
        </button>
      </form>

      {[...pending, ...done].map((t) => (
        <div key={t.id} className="flex items-center gap-2">
          <button
            onClick={() => updateTask.mutate({ id: t.id, done: !t.done })}
            className={
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ' +
              (t.done
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'border-[var(--border)] text-[var(--text-muted)]')
            }
          >
            <Check size={12} />
          </button>
          <span className={'flex-1 text-sm ' + (t.done ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text)]')}>
            {t.title}
          </span>
          <button onClick={() => deleteTask.mutate(t.id)} className="text-[var(--text-muted)]">
            <Trash2 size={13} />
          </button>
        </div>
      ))}
    </Card>
  )
}

export default function RoutinesScreen() {
  const location = useLocation()
  const { data: routines, isLoading } = useRoutines()
  const { data: profile } = useProfile()
  const [formState, setFormState] = useState<'closed' | 'create' | Routine>(
    (location.state as { create?: boolean } | null)?.create ? 'create' : 'closed',
  )

  const active = routines?.filter((r) => r.active) ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ScreenTitle>Rotinas</ScreenTitle>
        <button
          onClick={() => setFormState(formState === 'closed' ? 'create' : 'closed')}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]"
        >
          <Plus size={18} />
        </button>
      </div>
      <p className="-mt-3 text-xs text-[var(--text-muted)]">
        Água, exercício, dieta, sono — o que você quiser acompanhar além das doses.
      </p>

      {formState !== 'closed' && (
        <RoutineForm
          routine={formState === 'create' ? undefined : formState}
          onDone={() => setFormState('closed')}
        />
      )}

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {active.length === 0 && formState === 'closed' && (
        <EmptyState>Nenhuma rotina ainda. Toque no + pra criar a primeira.</EmptyState>
      )}

      <div className="space-y-3">
        {active.map((r) => (
          <RoutineRow key={r.id} routine={r} onEdit={() => setFormState(r)} />
        ))}
      </div>

      {profile?.nsfwMode && <TasksSection />}
    </div>
  )
}
