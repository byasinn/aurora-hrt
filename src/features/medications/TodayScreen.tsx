import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Heart, Calendar, Pill, Syringe, Bandage, Droplet, Sparkles, Undo2, ListChecks, TriangleAlert, Check } from 'lucide-react'
import { EmptyState } from '../../components/ui'
import SwipeableRow from '../../components/SwipeableRow'
import { useToday, useLogDose, useUpdateDoseLog, type TodayItem } from '../../api/doses'
import { useProfile } from '../../api/profile'
import { useDeleteMedication, useMedications } from '../../api/medications'
import { useRoutines } from '../../api/routines'
import { useTasks, useUpdateTask } from '../../api/tasks'
import { formatTime } from '../../lib/dateUtils'
import WelcomeBanner from '../../components/WelcomeBanner'
import TipOfDayCard from '../../components/TipOfDayCard'
import MedicationForm from './MedicationForm'
import RoutineRow from '../routines/RoutineRow'
import type { Medication } from '../../../shared/types'

const ROUTE_LABELS: Record<string, string> = {
  oral: 'Oral',
  injection: 'Injeção',
  patch: 'Adesivo',
  gel: 'Gel',
  other: 'Outro',
}

const ROUTE_ICONS: Record<string, typeof Pill> = {
  oral: Pill,
  injection: Syringe,
  patch: Bandage,
  gel: Droplet,
  other: Sparkles,
}

function DoseRow({
  item,
  completing,
  onEdit,
  onStartComplete,
  onAnimationDone,
}: {
  item: TodayItem
  completing: boolean
  onEdit: (medicationId: number) => void
  onStartComplete: () => void
  onAnimationDone: () => void
}) {
  const logDose = useLogDose()
  const updateDose = useUpdateDoseLog()
  const deleteMed = useDeleteMedication()
  const RouteIcon = ROUTE_ICONS[item.medication.route] ?? Sparkles

  function markTaken() {
    if (completing) return
    onStartComplete()
    if (item.doseLogId) {
      updateDose.mutate({ id: item.doseLogId, status: 'taken', takenAt: new Date() })
    } else {
      logDose.mutate({
        medicationId: item.medication.id,
        scheduledFor: new Date(item.scheduledFor),
        status: 'taken',
        takenAt: new Date(),
      })
    }
  }

  function handleDelete() {
    if (confirm(`Excluir "${item.medication.name}"? Isso remove o medicamento e seu histórico.`)) {
      deleteMed.mutate(item.medication.id)
    }
  }

  return (
    <SwipeableRow
      onTap={markTaken}
      onEdit={() => onEdit(item.medication.id)}
      onDelete={handleDelete}
      completing={completing}
      onCompleteAnimationDone={onAnimationDone}
    >
      <div
        className={
          'flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 [box-shadow:var(--shadow)] border-l-4 ' +
          (item.status === 'missed' ? 'border-l-red-500' : 'border-l-[var(--accent)]')
        }
      >
        <RouteIcon size={22} className="text-[var(--accent)]" />
        <div className="flex-1">
          <p className="font-medium text-[var(--text)]">{item.medication.name}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {item.medication.doseAmount}
            {item.medication.doseUnit} · {ROUTE_LABELS[item.medication.route] ?? item.medication.route} ·{' '}
            {formatTime(item.scheduledFor)}
            {item.status === 'missed' && ' · atrasado'}
          </p>
        </div>
      </div>
    </SwipeableRow>
  )
}

function DoneRow({ item }: { item: TodayItem }) {
  const updateDose = useUpdateDoseLog()
  const logDose = useLogDose()

  function undo() {
    if (item.doseLogId) {
      updateDose.mutate({ id: item.doseLogId, status: 'pending', takenAt: null })
    } else {
      logDose.mutate({
        medicationId: item.medication.id,
        scheduledFor: new Date(item.scheduledFor),
        status: 'pending',
      })
    }
  }

  return (
    <motion.button
      type="button"
      onClick={undo}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 0.5, y: 0 }}
      whileTap={{ opacity: 0.9 }}
      className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-left"
    >
      <span className="text-xs text-[var(--text-muted)]">{item.status === 'taken' ? '✓' : '–'}</span>
      <p className="flex-1 text-sm text-[var(--text)] line-through">{item.medication.name}</p>
      <Undo2 size={14} className="text-[var(--text-muted)]" />
    </motion.button>
  )
}

function AddDoseButton({ prominent, onClick }: { prominent: boolean; onClick: () => void }) {
  if (prominent) {
    return (
      <button
        onClick={onClick}
        className="flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl py-6 text-[var(--accent-contrast)] [box-shadow:var(--shadow)]"
        style={{ background: 'var(--accent)' }}
      >
        <Plus size={24} />
        <span className="text-sm font-medium">Adicionar dose</span>
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] py-3 text-sm text-[var(--text-muted)]"
    >
      <Plus size={16} />
      Adicionar dose
    </button>
  )
}

function BigLinkButton({
  to,
  icon: Icon,
  label,
  variant,
  state,
}: {
  to: string
  icon: typeof Heart
  label: string
  variant: 'accent' | 'accent2' | 'outline'
  state?: unknown
}) {
  if (variant === 'outline') {
    return (
      <Link to={to} state={state} className="flex-1">
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] py-3.5 text-sm text-[var(--text-muted)]">
          <Icon size={18} />
          <span className="font-medium">{label}</span>
        </div>
      </Link>
    )
  }
  return (
    <Link to={to} state={state} className="flex-1">
      <div
        className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-5 text-[var(--accent-contrast)] [box-shadow:var(--shadow)]"
        style={{ background: variant === 'accent' ? 'var(--accent)' : 'var(--accent-2)' }}
      >
        <Icon size={22} />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </Link>
  )
}

export default function TodayScreen() {
  const { data, isLoading, isError } = useToday()
  const { data: profile } = useProfile()
  const { data: medications } = useMedications()
  const { data: routines } = useRoutines()
  const activeRoutines = (routines ?? []).filter((r) => r.active)
  const { data: tasks } = useTasks()
  const updateTask = useUpdateTask()
  const pendingTasks = (tasks ?? []).filter((t) => !t.done)
  const [formState, setFormState] = useState<'closed' | 'create' | Medication>('closed')
  const [completingKeys, setCompletingKeys] = useState<Set<string>>(new Set())

  const keyFor = (item: TodayItem) => `${item.medication.id}-${item.scheduledFor}`
  const allItems = data?.items ?? []
  const pending = allItems.filter(
    (i) => completingKeys.has(keyFor(i)) || i.status === 'pending' || i.status === 'missed',
  )
  const done = allItems.filter(
    (i) => !completingKeys.has(keyFor(i)) && (i.status === 'taken' || i.status === 'skipped'),
  )

  function openEdit(medicationId: number) {
    const med = medications?.find((m) => m.id === medicationId)
    if (med) setFormState(med)
  }

  return (
    <div>
      <WelcomeBanner />

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {isError && (
        <EmptyState>
          Não foi possível carregar os dados de hoje. Verifique a conexão com o backend.
        </EmptyState>
      )}

      {data && data.items.length === 0 && formState === 'closed' && (
        <div className="mb-4 space-y-2">
          <AddDoseButton prominent onClick={() => setFormState('create')} />
          {profile?.notOnMedsYet && (
            <p className="text-center text-xs text-[var(--text-muted)]">
              Sem pressa — quando decidir começar, é só tocar aqui.
            </p>
          )}
        </div>
      )}

      {data && data.items.length > 0 && formState === 'closed' && (
        <div className="mb-4 space-y-1.5">
          <AddDoseButton prominent={false} onClick={() => setFormState('create')} />
          <Link to="/medications" className="block text-center text-xs text-[var(--accent)]">
            Gerenciar remédios e histórico →
          </Link>
        </div>
      )}

      {formState !== 'closed' && (
        <div className="mb-4">
          <MedicationForm
            medication={formState === 'create' ? undefined : formState}
            onDone={() => setFormState('closed')}
          />
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {pending.map((item) => {
            const key = keyFor(item)
            return (
              <DoseRow
                key={key}
                item={item}
                completing={completingKeys.has(key)}
                onEdit={openEdit}
                onStartComplete={() => setCompletingKeys((cur) => new Set(cur).add(key))}
                onAnimationDone={() =>
                  setCompletingKeys((cur) => {
                    const next = new Set(cur)
                    next.delete(key)
                    return next
                  })
                }
              />
            )
          })}
        </AnimatePresence>
      </div>

      {done.length > 0 && (
        <div className="mt-4 space-y-2">
          <AnimatePresence initial={false}>
            {done.map((item) => (
              <DoneRow key={`${item.medication.id}-${item.scheduledFor}`} item={item} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {pendingTasks.length > 0 && (
        <div className="mt-5 space-y-2">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)]">
            <TriangleAlert size={14} /> Tarefas pendentes
          </h2>
          <div className="space-y-2">
            {pendingTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => updateTask.mutate({ id: t.id, done: true })}
                className="flex w-full items-center gap-3 rounded-2xl border border-amber-500/30 bg-[var(--surface)] p-3 text-left [box-shadow:var(--shadow)]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)]">
                  <Check size={13} />
                </span>
                <span className="flex-1 text-sm text-[var(--text)]">{t.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeRoutines.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)]">
              <ListChecks size={14} /> Rotinas de hoje
            </h2>
            <Link to="/routines" className="text-xs text-[var(--accent)]">
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {activeRoutines.map((r) => (
              <RoutineRow key={r.id} routine={r} compact />
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <TipOfDayCard />
      </div>

      <div className="mt-1 flex gap-3">
        <BigLinkButton to="/mood" icon={Heart} label="Registrar humor" variant="accent" />
        <BigLinkButton to="/calendar" icon={Calendar} label="Ver calendário" variant="accent2" />
      </div>
      <div className="mt-2">
        <BigLinkButton to="/routines" icon={ListChecks} label="Criar rotina" variant="outline" state={{ create: true }} />
      </div>
    </div>
  )
}
