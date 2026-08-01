import { useState, type FormEvent } from 'react'
import { Button, Card } from '../../components/ui'
import Switch from '../../components/Switch'
import { useCreateRoutine, useUpdateRoutine } from '../../api/routines'
import { useProfile } from '../../api/profile'
import type { Routine, RoutineType } from '../../../shared/types'

const ICONS = ['💧', '🍎', '🏃', '😴', '🧘', '🚭', '📚', '☀️', '✅', '😏', '🔥']

const NSFW_SUGGESTIONS: { name: string; icon: string }[] = [
  { name: 'Momento a sós', icon: '😏' },
  { name: 'Autocuidado íntimo', icon: '🔥' },
  { name: 'Explorar o corpo', icon: '💦' },
]

export default function RoutineForm({ routine, onDone }: { routine?: Routine; onDone: () => void }) {
  const isEdit = !!routine
  const createRoutine = useCreateRoutine()
  const updateRoutine = useUpdateRoutine()
  const { data: profile } = useProfile()

  const [name, setName] = useState(routine?.name ?? '')
  const [icon, setIcon] = useState(routine?.icon ?? '✅')
  const [type, setType] = useState<RoutineType>((routine?.type as RoutineType) ?? 'checkbox')
  const [targetCount, setTargetCount] = useState(routine?.targetCount ?? 8)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    if (isEdit) {
      await updateRoutine.mutateAsync({
        id: routine.id,
        name,
        icon,
        type,
        targetCount: type === 'counter' ? targetCount : null,
      })
    } else {
      await createRoutine.mutateAsync({
        name,
        icon,
        type,
        targetCount: type === 'counter' ? targetCount : null,
        active: true,
      })
    }
    onDone()
  }

  return (
    <Card className="space-y-4">
      <h2 className="text-base font-semibold text-[var(--text)]">{isEdit ? 'Editar rotina' : 'Nova rotina'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Beber água, Exercício…"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        {!isEdit && profile?.nsfwMode && (
          <div className="flex flex-wrap gap-2">
            {NSFW_SUGGESTIONS.map((s) => (
              <button
                type="button"
                key={s.name}
                onClick={() => {
                  setName(s.name)
                  setIcon(s.icon)
                }}
                className="rounded-full border border-dashed border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-muted)]"
              >
                {s.icon} {s.name}
              </button>
            ))}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Ícone</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => setIcon(i)}
                className={
                  'flex h-10 w-10 items-center justify-center rounded-full border text-lg ' +
                  (icon === i ? 'border-[var(--accent)] bg-[var(--surface-2)]' : 'border-[var(--border)]')
                }
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
          <span className="text-sm text-[var(--text)]">Contar quantidade (ex: copos de água)</span>
          <Switch checked={type === 'counter'} onChange={(v) => setType(v ? 'counter' : 'checkbox')} />
        </label>

        {type === 'counter' && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Meta diária</label>
            <input
              type="number"
              min={1}
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={createRoutine.isPending || updateRoutine.isPending}>
            Salvar
          </Button>
        </div>
      </form>
    </Card>
  )
}
