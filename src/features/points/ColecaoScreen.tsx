import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Check } from 'lucide-react'
import clsx from 'clsx'
import { Card, ScreenTitle } from '../../components/ui'
import Switch from '../../components/Switch'
import { useProfile, useUpdateProfile } from '../../api/profile'
import { useUnlockedTitles } from '../../api/titles'
import { useUnlockedAchievements } from '../../api/achievements'
import { useUnlockedTrophies } from '../../api/trophies'
import { usePointsStats } from './usePointsStats'
import { useSyncCollectibles } from './useSyncCollectibles'
import { SFW_TITLES, titleName } from '../../lib/titles'
import { ACHIEVEMENTS_SFW, TROPHIES_SFW } from '../../lib/collectiblesEngine'
import { getCollectibleIcon } from '../../lib/collectibleIcons'

type Tab = 'titulos' | 'conquistas' | 'trofeus'

function TitleGroup({
  titles,
  unlockedKeys,
  equipped,
  onEquip,
  textStyle,
}: {
  titles: typeof SFW_TITLES
  unlockedKeys: Set<string>
  equipped: string | null
  onEquip: (key: string) => void
  textStyle: string | null | undefined
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {titles.map((t) => {
        const isUnlocked = unlockedKeys.has(t.key)
        const isEquipped = equipped === t.key
        const Icon = getCollectibleIcon(t.icon)
        return (
          <button
            key={t.key}
            onClick={() => isUnlocked && onEquip(t.key)}
            disabled={!isUnlocked}
            className={clsx(
              'relative flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition',
              isEquipped ? 'border-[var(--accent)] bg-[var(--surface-2)]' : 'border-[var(--border)]',
              !isUnlocked && 'opacity-35 grayscale',
            )}
          >
            {isEquipped && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
                <Check size={10} />
              </span>
            )}
            {Icon && <Icon size={20} className="text-[var(--accent)]" />}
            <span className="text-[10px] font-medium text-[var(--text)]">{titleName(t, textStyle)}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function ColecaoScreen() {
  useSyncCollectibles()
  const [tab, setTab] = useState<Tab>('titulos')
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const stats = usePointsStats()
  const { data: unlockedTitles = [] } = useUnlockedTitles()
  const { data: unlockedAch = [] } = useUnlockedAchievements()
  const { data: unlockedTro = [] } = useUnlockedTrophies()

  const sfwTitleKeys = new Set(unlockedTitles.filter((t) => t.track === 'sfw').map((t) => t.titleKey))
  const achKeys = new Set(unlockedAch.map((a) => a.achievementKey))
  const troKeys = new Set(unlockedTro.map((t) => t.trophyKey))

  return (
    <div className="space-y-4">
      <Link to="/pontos" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ChevronLeft size={16} /> Pontos
      </Link>
      <ScreenTitle>Coleção</ScreenTitle>

      <div className="grid grid-cols-3 gap-2">
        {(['titulos', 'conquistas', 'trofeus'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'rounded-xl border px-2 py-2 text-xs font-medium capitalize transition',
              tab === t
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
            )}
          >
            {t === 'titulos' ? 'Títulos' : t === 'conquistas' ? 'Conquistas' : 'Troféus'}
          </button>
        ))}
      </div>

      {tab === 'titulos' && (
        <>
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--text)]">Mostrar título no perfil</span>
              <Switch
                checked={profile?.showTitlesSfw ?? false}
                onChange={(checked) => updateProfile.mutate({ showTitlesSfw: checked })}
              />
            </div>
          </Card>

          <Card className="space-y-2">
            <p className="text-sm font-medium text-[var(--text)]">Títulos</p>
            <TitleGroup
              titles={SFW_TITLES}
              unlockedKeys={sfwTitleKeys}
              equipped={profile?.equippedTitleSfw ?? null}
              onEquip={(key) => updateProfile.mutate({ equippedTitleSfw: key })}
              textStyle={profile?.textStyle}
            />
          </Card>
        </>
      )}

      {tab === 'conquistas' && (
        <>
          <Card className="flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--text)]">Mostrar conquistas no perfil</span>
            <Switch
              checked={profile?.showAchievementsOnProfile ?? false}
              onChange={(checked) => updateProfile.mutate({ showAchievementsOnProfile: checked })}
            />
          </Card>

          <Card className="space-y-2">
            <p className="text-sm font-medium text-[var(--text)]">Conquistas</p>
            <div className="grid grid-cols-3 gap-2">
              {ACHIEVEMENTS_SFW.map((a) => {
                const isUnlocked = achKeys.has(a.key) || a.isMet(stats)
                const Icon = getCollectibleIcon(a.icon)
                return (
                  <div
                    key={a.key}
                    className={clsx(
                      'flex flex-col items-center gap-1 rounded-xl border border-[var(--border)] p-2 text-center',
                      !isUnlocked && 'opacity-35 grayscale',
                    )}
                  >
                    {Icon && <Icon size={20} className="text-[var(--accent)]" />}
                    <span className="text-[10px] font-medium text-[var(--text)]">{a.title}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">{a.description}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}

      {tab === 'trofeus' && (
        <>
          <Card className="flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--text)]">Mostrar troféus no perfil</span>
            <Switch
              checked={profile?.showTrophiesOnProfile ?? false}
              onChange={(checked) => updateProfile.mutate({ showTrophiesOnProfile: checked })}
            />
          </Card>

          <Card className="space-y-2">
            <p className="text-sm font-medium text-[var(--text)]">Troféus</p>
            <div className="grid grid-cols-3 gap-2">
              {TROPHIES_SFW.map((t) => {
                const isUnlocked = troKeys.has(t.key) || t.isMet(stats)
                const Icon = getCollectibleIcon(t.icon)
                return (
                  <div
                    key={t.key}
                    className={clsx(
                      'flex flex-col items-center gap-1 rounded-xl border border-[var(--border)] p-2 text-center',
                      !isUnlocked && 'opacity-35 grayscale',
                    )}
                  >
                    {Icon && <Icon size={20} className="text-[var(--accent)]" />}
                    <span className="text-[10px] font-medium text-[var(--text)]">{t.title}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">{t.description}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
