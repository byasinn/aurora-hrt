import { Link } from 'react-router-dom'
import { Sparkles, LayoutGrid, ChevronRight } from 'lucide-react'
import { Card, ScreenTitle } from '../../components/ui'
import { usePointsStats } from './usePointsStats'
import { useSyncCollectibles } from './useSyncCollectibles'
import { useProfile } from '../../api/profile'
import { currentTitle, titleName } from '../../lib/titles'
import { getCollectibleIcon } from '../../lib/collectibleIcons'

export default function PointsScreen() {
  useSyncCollectibles()
  const stats = usePointsStats()
  const { data: profile } = useProfile()
  const sfwTitle = currentTitle(stats.brilho)
  const SfwIcon = getCollectibleIcon(sfwTitle.icon)

  return (
    <div className="space-y-4">
      <ScreenTitle>Pontos</ScreenTitle>

      <Link to="/pontos/brilho">
        <Card className="flex flex-col items-center gap-1.5 text-center">
          <Sparkles size={22} className="text-[var(--accent)]" />
          <p className="text-2xl font-semibold text-[var(--text)]">{stats.brilho}</p>
          <p className="text-xs text-[var(--text-muted)]">Brilho</p>
          <p className="mt-1 flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
            {SfwIcon && <SfwIcon size={11} />} {titleName(sfwTitle, profile?.textStyle)}
          </p>
        </Card>
      </Link>

      <Link to="/pontos/colecao">
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
            <LayoutGrid size={18} />
          </span>
          <div className="flex-1">
            <p className="font-medium text-[var(--text)]">Coleção</p>
            <p className="text-xs text-[var(--text-muted)]">Títulos, conquistas e troféus — e o que mostrar no perfil</p>
          </div>
          <ChevronRight size={18} className="text-[var(--text-muted)]" />
        </Card>
      </Link>
    </div>
  )
}
