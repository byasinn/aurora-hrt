import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Check, Trash2, Clock } from 'lucide-react'
import { Button, Card, EmptyState, ScreenTitle } from '../../components/ui'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../../api/tasks'
import { PUNISHMENT_TEMPLATES, formatDuration } from '../../lib/punishmentTemplates'
import { formatTime } from '../../lib/dateUtils'

function TemplatePicker({ onClose }: { onClose: () => void }) {
  const createTask = useCreateTask()
  const [templateKey, setTemplateKey] = useState(PUNISHMENT_TEMPLATES[0].key)
  const template = PUNISHMENT_TEMPLATES.find((t) => t.key === templateKey)!
  const [hours, setHours] = useState(template.durationOptions[0])

  function pickTemplate(key: string) {
    setTemplateKey(key)
    const t = PUNISHMENT_TEMPLATES.find((x) => x.key === key)!
    setHours(t.durationOptions[0])
  }

  async function handleApply() {
    await createTask.mutateAsync({ title: template.title, icon: template.icon, durationHours: hours, done: false })
    onClose()
  }

  return (
    <Card className="space-y-3">
      <p className="text-sm font-medium text-[var(--text)]">Aplicar punição</p>
      <div className="flex flex-wrap gap-2">
        {PUNISHMENT_TEMPLATES.map((t) => (
          <button
            key={t.key}
            onClick={() => pickTemplate(t.key)}
            className={
              'rounded-full border px-3 py-1.5 text-sm transition ' +
              (templateKey === t.key
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]')
            }
          >
            {t.icon} {t.title}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">Duração</p>
        <div className="flex flex-wrap gap-2">
          {template.durationOptions.map((h) => (
            <button
              key={h}
              onClick={() => setHours(h)}
              className={
                'rounded-lg border px-2.5 py-1.5 text-xs transition ' +
                (hours === h
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]')
              }
            >
              {formatDuration(h)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button className="flex-1" onClick={handleApply} disabled={createTask.isPending}>
          Aplicar
        </Button>
      </div>
    </Card>
  )
}

export default function PunicoesScreen() {
  const { data: tasks } = useTasks()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const [picking, setPicking] = useState(false)
  const pending = (tasks ?? []).filter((t) => !t.done)
  const done = (tasks ?? []).filter((t) => t.done)

  return (
    <div className="space-y-4">
      <Link to="/kink" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ChevronLeft size={16} /> Kink
      </Link>
      <ScreenTitle>Punições</ScreenTitle>

      {!picking ? (
        <Button onClick={() => setPicking(true)} className="w-full">
          Aplicar uma punição
        </Button>
      ) : (
        <TemplatePicker onClose={() => setPicking(false)} />
      )}

      {pending.length === 0 && done.length === 0 && (
        <EmptyState>Nenhuma punição por aqui ainda.</EmptyState>
      )}

      {pending.length > 0 && (
        <Card className="space-y-2">
          {pending.map((t) => (
            <div key={t.id} className="flex items-center gap-2">
              <button
                onClick={() => updateTask.mutate({ id: t.id, done: true })}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)]"
              >
                <Check size={12} />
              </button>
              <div className="flex-1">
                <p className="text-sm text-[var(--text)]">{t.title}</p>
                {t.dueAt && (
                  <p className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Clock size={11} /> até {formatTime(t.dueAt as unknown as string)}
                  </p>
                )}
              </div>
              <button onClick={() => deleteTask.mutate(t.id)} className="text-[var(--text-muted)]">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </Card>
      )}

      {done.length > 0 && (
        <Card className="space-y-2">
          {done.map((t) => (
            <div key={t.id} className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]">
                <Check size={12} />
              </span>
              <span className="flex-1 text-sm text-[var(--text-muted)] line-through">{t.title}</span>
              <button onClick={() => deleteTask.mutate(t.id)} className="text-[var(--text-muted)]">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
