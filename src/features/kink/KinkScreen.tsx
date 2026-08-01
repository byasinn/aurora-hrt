import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, TriangleAlert, Flame, Check, Trash2 } from 'lucide-react'
import { Card, EmptyState, ScreenTitle } from '../../components/ui'
import KinkChips from '../../components/KinkChips'
import { useProfile, useUpdateProfile } from '../../api/profile'
import { useTasks, useUpdateTask, useDeleteTask } from '../../api/tasks'
import { useRoutines } from '../../api/routines'
import RoutineRow from '../routines/RoutineRow'

type Tab = 'kinks' | 'punishments' | 'masturbation'

const TABS: { key: Tab; label: string; icon: typeof Heart }[] = [
  { key: 'kinks', label: 'Meus kinks', icon: Heart },
  { key: 'punishments', label: 'Punições', icon: TriangleAlert },
  { key: 'masturbation', label: 'Masturbação', icon: Flame },
]

function PunishmentsTab() {
  const { data: tasks } = useTasks()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  if (!tasks || tasks.length === 0) {
    return (
      <EmptyState>
        Nenhuma punição por aqui ainda. Elas são criadas em Rotinas — aqui é só pra ver e marcar como feita.
      </EmptyState>
    )
  }

  return (
    <Card className="space-y-2">
      {tasks.map((t) => (
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
      <Link to="/routines" className="inline-block pt-1 text-xs text-[var(--accent)]">
        Criar uma nova punição em Rotinas →
      </Link>
    </Card>
  )
}

function MasturbationTab() {
  const { data: routines } = useRoutines()
  const active = (routines ?? []).filter((r) => r.active)

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-muted)]">
        Suas rotinas (treinos, CEI e afins) — criar e editar continua em Rotinas.
      </p>
      {active.length === 0 ? (
        <EmptyState>Nenhuma rotina ainda.</EmptyState>
      ) : (
        <div className="space-y-3">
          {active.map((r) => (
            <RoutineRow key={r.id} routine={r} compact />
          ))}
        </div>
      )}
      <Link to="/routines" className="inline-block text-xs text-[var(--accent)]">
        Ver/criar rotinas →
      </Link>
    </div>
  )
}

export default function KinkScreen() {
  const [tab, setTab] = useState<Tab>('kinks')
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const kinks = (profile?.kinks as string[]) ?? []

  return (
    <div className="space-y-4">
      <ScreenTitle>Kink</ScreenTitle>

      <div className="grid grid-cols-3 gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={
              'flex flex-col items-center gap-1 rounded-2xl border py-3 text-center transition ' +
              (tab === key
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]')
            }
          >
            <Icon size={18} />
            <span className="text-[11px] font-medium">{label}</span>
          </button>
        ))}
      </div>

      {tab === 'kinks' && (
        <Card>
          <KinkChips kinks={kinks} onChange={(next) => updateProfile.mutate({ kinks: next })} />
        </Card>
      )}
      {tab === 'punishments' && <PunishmentsTab />}
      {tab === 'masturbation' && <MasturbationTab />}
    </div>
  )
}
