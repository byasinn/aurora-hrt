import { useState } from 'react'
import clsx from 'clsx'
import { Pencil, Plus, Trash2 } from '../../components/icons'
import { Button, Card } from '../../components/ui'
import Switch from '../../components/Switch'
import { useAdminMissions, useDeleteMission, useSaveMission, type MissionRow } from '../../api/points'
import { MISSION_METRICS, rewardLabel, type MissionDefInput, type MissionMetric } from '../../../shared/missions'
import { toastError } from '../../lib/toast'

// Missões diárias e semanais: o admin cria, edita, desliga e apaga. As de boas-vindas ficam no
// código (shared/missions.ts). O que a missão mede é uma lista fixa (o servidor sabe contar).

const EMPTY: MissionDefInput = {
  period: 'daily',
  metric: 'daylog',
  target: 1,
  title: '',
  description: '',
  rewardKind: 'brilho',
  rewardRarity: 'common',
  rewardAmount: 3,
  active: true,
  sortOrder: 0,
}

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]'

function MissionForm({ initial, onDone }: { initial: MissionDefInput & { id?: number }; onDone: () => void }) {
  const save = useSaveMission()
  const [m, setM] = useState(initial)
  const set = <K extends keyof MissionDefInput>(k: K, v: MissionDefInput[K]) => setM((cur) => ({ ...cur, [k]: v }))

  function submit() {
    save.mutate(m, { onSuccess: onDone, onError: (e) => toastError(e) })
  }

  return (
    <Card className="space-y-3">
      <p className="font-bold">{initial.id ? 'Editar missão' : 'Nova missão'}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs font-medium text-[var(--text-muted)]">
          Período
          <select className={inputClass} value={m.period} onChange={(e) => set('period', e.target.value as MissionDefInput['period'])}>
            <option value="daily">Diária (renova todo dia)</option>
            <option value="weekly">Semanal (renova toda segunda)</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-[var(--text-muted)]">
          O que mede
          <select className={inputClass} value={m.metric} onChange={(e) => set('metric', e.target.value as MissionMetric)}>
            {Object.entries(MISSION_METRICS).map(([key, def]) => (
              <option key={key} value={key}>
                {def.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-[var(--text-muted)] sm:col-span-2">
          Título
          <input className={inputClass} value={m.title} maxLength={80} onChange={(e) => set('title', e.target.value)} placeholder="Ex.: Registre seu dia" />
        </label>
        <label className="space-y-1 text-xs font-medium text-[var(--text-muted)] sm:col-span-2">
          Descrição (opcional)
          <input className={inputClass} value={m.description} maxLength={200} onChange={(e) => set('description', e.target.value)} />
        </label>
        <label className="space-y-1 text-xs font-medium text-[var(--text-muted)]">
          Meta {m.metric === 'workout_goal' || m.metric === 'meds_on_time' ? '(usa a meta da própria pessoa)' : ''}
          <input
            type="number"
            min={1}
            max={100}
            className={inputClass}
            value={m.target}
            disabled={m.metric === 'workout_goal' || m.metric === 'meds_on_time'}
            onChange={(e) => set('target', Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-[var(--text-muted)]">
          Ordem
          <input type="number" className={inputClass} value={m.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value) || 0)} />
        </label>
        <label className="space-y-1 text-xs font-medium text-[var(--text-muted)]">
          Recompensa
          <select className={inputClass} value={m.rewardKind} onChange={(e) => set('rewardKind', e.target.value as MissionDefInput['rewardKind'])}>
            <option value="chest">Baú</option>
            <option value="brilho">Brilho direto</option>
            <option value="potion">Poção do tempo</option>
          </select>
        </label>
        {m.rewardKind === 'chest' ? (
          <label className="space-y-1 text-xs font-medium text-[var(--text-muted)]">
            Tipo de baú
            <select className={inputClass} value={m.rewardRarity} onChange={(e) => set('rewardRarity', e.target.value as MissionDefInput['rewardRarity'])}>
              <option value="common">Comum (10–25 Brilho, às vezes poção ou item)</option>
              <option value="rare">Raro (25–50 Brilho, mais chance de item)</option>
            </select>
          </label>
        ) : (
          <label className="space-y-1 text-xs font-medium text-[var(--text-muted)]">
            Quantidade
            <input
              type="number"
              min={1}
              max={200}
              className={inputClass}
              value={m.rewardAmount}
              onChange={(e) => set('rewardAmount', Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
        )}
      </div>
      <label className="flex items-center justify-between text-sm">
        Ativa
        <Switch checked={m.active} onChange={(v) => set('active', v)} />
      </label>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onDone}>
          Cancelar
        </Button>
        <Button className="flex-1" onClick={submit} disabled={save.isPending}>
          Salvar
        </Button>
      </div>
    </Card>
  )
}

function MissionList({ title, rows, onEdit }: { title: string; rows: MissionRow[]; onEdit: (m: MissionRow) => void }) {
  const del = useDeleteMission()
  const save = useSaveMission()
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">{title}</h2>
      {rows.length === 0 && <p className="text-sm text-[var(--text-muted)]">Nenhuma.</p>}
      {rows.map((m) => (
        <Card key={m.id} className={clsx('flex items-center gap-3 p-3', !m.active && 'opacity-50')}>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{m.title}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {MISSION_METRICS[m.metric]?.label ?? m.metric} · meta {m.target} · {rewardLabel(m)}
            </p>
          </div>
          <Switch checked={m.active} onChange={(v) => save.mutate({ ...m, active: v }, { onError: (e) => toastError(e) })} />
          <button aria-label="Editar" onClick={() => onEdit(m)} className="p-1 text-[var(--text-muted)]">
            <Pencil size={15} />
          </button>
          <button
            aria-label="Apagar"
            onClick={() => confirm(`Apagar "${m.title}"? Quem já pegou a recompensa continua com ela.`) && del.mutate(m.id)}
            className="p-1 text-red-500"
          >
            <Trash2 size={15} />
          </button>
        </Card>
      ))}
    </section>
  )
}

export default function AdminMissions() {
  const { data, isLoading } = useAdminMissions()
  const [editing, setEditing] = useState<(MissionDefInput & { id?: number }) | null>(null)

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Missões</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Diárias e semanais que aparecem na aba Missões. As de boas-vindas são fixas. Diária com baú todo dia infla a lojinha — prefira Brilho direto
            pequeno.
          </p>
        </div>
        {!editing && (
          <Button className="shrink-0" onClick={() => setEditing({ ...EMPTY })}>
            <Plus size={16} /> Nova
          </Button>
        )}
      </div>
      {editing && <MissionForm initial={editing} onDone={() => setEditing(null)} />}
      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {data && (
        <div className="grid gap-5 lg:grid-cols-2">
          <MissionList title="Diárias" rows={data.filter((m) => m.period === 'daily')} onEdit={setEditing} />
          <MissionList title="Semanais" rows={data.filter((m) => m.period === 'weekly')} onEdit={setEditing} />
        </div>
      )}
    </div>
  )
}
