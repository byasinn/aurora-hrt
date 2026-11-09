import { Link } from 'react-router-dom'
import { ChevronLeft, Sparkles } from '../../components/icons'
import { Card, ScreenTitle } from '../../components/ui'
import { usePointsStats } from './usePointsStats'
import { usePoints } from '../../api/points'
import { POINTS } from '../../../shared/points'
import { useUnlockedTitles } from '../../api/titles'
import { useProfile } from '../../api/profile'
import { SFW_TITLES, currentTitle, nextTitle, titleName } from '../../lib/titles'
import { getCollectibleIcon } from '../../lib/collectibleIcons'

export default function BrilhoScreen() {
  const stats = usePointsStats()
  const { data: unlocked = [] } = useUnlockedTitles()
  const { data: profile } = useProfile()
  const unlockedKeys = new Set(unlocked.filter((t) => t.track === 'sfw').map((t) => t.titleKey))

  const current = currentTitle(stats.brilho)
  const next = nextTitle(stats.brilho)
  const progressPct = next ? Math.min(100, Math.round((stats.brilho / next.threshold) * 100)) : 100

  const { data: points } = usePoints()
  const b = points?.breakdown
  const breakdown = [
    { label: 'Registro do dia', value: b?.dayLog },
    { label: 'Rotinas (por dia)', value: b?.routines },
    { label: 'Rotinas apostadas', value: b?.routineBets },
    { label: 'Remédios em dia (semanas)', value: b?.meds },
    { label: 'Metas de treino (semanas)', value: b?.workouts },
    { label: 'Curtidas, comentários e posts', value: b?.social },
    { label: 'Streak (abrir o app)', value: points?.visits },
    { label: 'Baús', value: points?.chests },
    { label: 'Anos de transição', value: points?.transitionBonus },
    { label: 'Antes das regras novas', value: points?.legacy },
  ].filter((row) => (row.value ?? 0) > 0)
  const w = points?.week

  const rules = [
    `Registro do dia: humor +${POINTS.dayLog.mood}, energia +${POINTS.dayLog.energy}, libido +${POINTS.dayLog.libido}, sintomas +${POINTS.dayLog.symptoms}, notas +${POINTS.dayLog.notes}`,
    `Remédios: +${POINTS.medWeek} por remédio a cada semana tomada certinho (aplicação quinzenal ou mensal vale as semanas que cobre)`,
    `Treinos: +${POINTS.workoutWeek} quando bate a meta de treinos da semana`,
    `Rotinas: +${POINTS.routinePerDay} por rotina feita no dia (até ${POINTS.routinesCountedPerDay} por dia) — ou aposte a semana e ganhe +50% no domingo, se fizer todo dia`,
    `Curtir +${POINTS.like}, comentar +${POINTS.comment}, postar +${POINTS.post} — até ${POINTS.socialDailyCap} por dia`,
    `Abrir o app: +${POINTS.visit} por dia, e um baú raro a cada 7 dias seguidos`,
    'Marcou depois do dia? Fica no histórico, mas só vale Brilho com uma Poção do tempo',
    'Ciclo e atividade íntima não dão pontos — são só seus',
  ]

  return (
    <div className="space-y-4">
      <Link to="/pontos" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ChevronLeft size={16} /> Pontos
      </Link>
      <ScreenTitle>Brilho</ScreenTitle>

      <Card className="flex flex-col items-center gap-1 py-6 text-center">
        <Sparkles size={28} className="text-[var(--accent)]" />
        <p className="text-4xl font-semibold text-[var(--text)]">{stats.brilho}</p>
        <p className="text-xs text-[var(--text-muted)]">Saldo atual</p>
      </Card>

      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--text)]">Progresso pro próximo título</p>
          <p className="text-xs text-[var(--text-muted)]">{next ? `${stats.brilho}/${next.threshold}` : 'Máximo'}</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Atual: {titleName(current, profile?.textStyle)}
          {next && ` · Próximo: ${titleName(next, profile?.textStyle)}`}
        </p>
      </Card>

      {w && (
        <Card className="space-y-2">
          <p className="text-sm font-medium text-[var(--text)]">Essa semana</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Dias registrados</span>
              <span>{w.dayLogDays}/7</span>
            </div>
            {w.meds.map((m) => (
              <div key={m.medicationId} className="flex justify-between">
                <span className="text-[var(--text-muted)]">{m.name}</span>
                <span>{m.doneDays === m.dueDays ? 'em dia' : `${m.doneDays}/${m.dueDays} dias`}</span>
              </div>
            ))}
            {w.workoutGoal > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Treinos</span>
                <span>
                  {w.workoutsDone}/{w.workoutGoal}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Rotinas {w.betActive ? '(apostadas)' : ''}</span>
              <span>{w.betActive ? `${w.betOnTrack.filter((r) => r.onTrack).length}/${w.betOnTrack.length} no caminho` : `+${w.routinePoints}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Social hoje</span>
              <span>
                {w.socialToday}/{POINTS.socialDailyCap}
              </span>
            </div>
          </div>
        </Card>
      )}

      <Card className="space-y-2">
        <p className="text-sm font-medium text-[var(--text)]">De onde veio</p>
        <div className="space-y-1.5">
          {breakdown.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-muted)]">{row.label}</span>
              <span className="font-medium text-[var(--text)]">+{row.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-2">
        <p className="text-sm font-medium text-[var(--text)]">Como ganhar Brilho</p>
        <ul className="list-disc space-y-1 pl-4 text-xs text-[var(--text-muted)]">
          {rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-2">
        <p className="text-sm font-medium text-[var(--text)]">Títulos desbloqueados</p>
        <div className="grid grid-cols-3 gap-2">
          {SFW_TITLES.map((t) => {
            const isUnlocked = unlockedKeys.has(t.key) || stats.brilho >= t.threshold
            const Icon = getCollectibleIcon(t.icon)
            return (
              <div
                key={t.key}
                className={
                  'flex flex-col items-center gap-1 rounded-xl border border-[var(--border)] p-2 text-center ' +
                  (isUnlocked ? '' : 'opacity-35 grayscale')
                }
              >
                {Icon && <Icon size={20} className="text-[var(--accent)]" />}
                <span className="text-[10px] font-medium text-[var(--text)]">{titleName(t, profile?.textStyle)}</span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
