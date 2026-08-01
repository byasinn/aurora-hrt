import { useState, type FormEvent } from 'react'
import { Button, Card } from '../../components/ui'
import { useCreateRoutine, useUpdateRoutine } from '../../api/routines'
import { useProfile } from '../../api/profile'
import { ROUTINE_ICON_OPTIONS, DEFAULT_ROUTINE_ICON_KEY } from '../../lib/routineIcons'
import type { Routine, RoutineType } from '../../../shared/types'

const NSFW_SUGGESTIONS: { name: string; icon: string; type: RoutineType }[] = [
  { name: 'Momento a sós', icon: 'heart', type: 'checkbox' },
  { name: 'Treino de resistência', icon: 'flame', type: 'timer' },
  { name: 'Explorar o corpo', icon: 'flame', type: 'counter' },
]

const TYPE_OPTIONS: { value: RoutineType; label: string }[] = [
  { value: 'checkbox', label: 'Feito/não feito' },
  { value: 'counter', label: 'Contagem' },
  { value: 'timer', label: 'Cronômetro' },
]

export default function RoutineForm({ routine, onDone }: { routine?: Routine; onDone: () => void }) {
  const isEdit = !!routine
  const createRoutine = useCreateRoutine()
  const updateRoutine = useUpdateRoutine()
  const { data: profile } = useProfile()

  const [name, setName] = useState(routine?.name ?? '')
  const [icon, setIcon] = useState(routine?.icon ?? DEFAULT_ROUTINE_ICON_KEY)
  const [type, setType] = useState<RoutineType>((routine?.type as RoutineType) ?? 'checkbox')
  const [targetCount, setTargetCount] = useState(routine?.targetCount ?? 8)
  const [targetMinutes, setTargetMinutes] = useState(routine?.targetCount ? Math.round(routine.targetCount / 60) : 5)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const finalTarget = type === 'counter' ? targetCount : type === 'timer' ? targetMinutes * 60 : null

    if (isEdit) {
      await updateRoutine.mutateAsync({
        id: routine.id,
        name,
        icon,
        type,
        targetCount: finalTarget,
      })
    } else {
      await createRoutine.mutateAsync({
        name,
        icon,
        type,
        targetCount: finalTarget,
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
                  setType(s.type)
                }}
                className="rounded-full border border-dashed border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-muted)]"
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

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

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Como acompanhar</label>
          <div className="flex gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={
                  'flex-1 rounded-xl border px-2 py-2 text-xs transition ' +
                  (type === opt.value
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                    : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]')
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

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

        {type === 'timer' && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Meta (minutos)</label>
            <input
              type="number"
              min={1}
              value={targetMinutes}
              onChange={(e) => setTargetMinutes(Number(e.target.value))}
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
