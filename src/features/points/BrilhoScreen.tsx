import { Link } from 'react-router-dom'
import { ChevronLeft, Sparkles } from 'lucide-react'
import { Card, ScreenTitle } from '../../components/ui'
import { usePointsStats } from './usePointsStats'
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

  const breakdown = [
    { label: 'Posts (perfil + comunidade)', count: stats.postsCount, value: 10 },
    { label: 'Comentários', count: stats.commentsGivenCount, value: 3 },
    { label: 'Rotinas concluídas', count: stats.sfwRoutineCompletions, value: 5 },
    { label: 'Check-ins de humor', count: stats.totalMoodEntries, value: 2 },
    { label: 'Doses registradas', count: stats.totalDosesTaken, value: 1 },
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

      <Card className="space-y-2">
        <p className="text-sm font-medium text-[var(--text)]">Histórico de ganhos</p>
        <div className="space-y-1.5">
          {breakdown.map((b) => (
            <div key={b.label} className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-muted)]">
                {b.label} ({b.count}×{b.value})
              </span>
              <span className="font-medium text-[var(--text)]">+{b.count * b.value}</span>
            </div>
          ))}
        </div>
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
