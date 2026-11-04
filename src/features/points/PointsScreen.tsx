import { Link } from 'react-router-dom'
import { LayoutGrid, ChevronRight } from 'lucide-react'
import { Card, ScreenTitle } from '../../components/ui'
import { usePointsStats } from './usePointsStats'
import { useSyncCollectibles } from './useSyncCollectibles'
import { useProfile } from '../../api/profile'
import { currentTitle, titleName } from '../../lib/titles'
import { getCollectibleIcon } from '../../lib/collectibleIcons'
import PixelIcon from '../../components/PixelIcon'

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
        <Card className="flex flex-col items-center gap-2 py-6 text-center">
          <PixelIcon name="sparkle" size={36} />
          <p className="font-pixel text-4xl font-bold text-[var(--text)]">{stats.brilho}</p>
          <p className="font-pixel text-sm uppercase tracking-widest text-[var(--text-muted)]">Brilho</p>
          <p className="mt-1 flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-bold text-[var(--text)]">
            {SfwIcon && <SfwIcon size={14} className="text-[var(--accent)]" />} {titleName(sfwTitle, profile?.textStyle)}
          </p>
        </Card>
      </Link>

      <Link to="/pontos/colecao">
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
            <LayoutGrid size={18} />
          </span>
          <div className="flex-1">
            <p className="font-bold text-[var(--text)]">Coleção</p>
            <p className="text-sm text-[var(--text-muted)]">Títulos, conquistas e troféus — e o que mostrar no perfil</p>
          </div>
          <ChevronRight size={18} className="text-[var(--text-muted)]" />
        </Card>
      </Link>
    </div>
  )
}
