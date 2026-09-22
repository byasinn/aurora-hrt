import { useEffect } from 'react'
import { useUnlockedAchievements, useUnlockAchievement } from '../../api/achievements'
import { useUnlockedTrophies, useUnlockTrophy } from '../../api/trophies'
import { useUnlockedTitles, useUnlockTitle } from '../../api/titles'
import { useCreateMessage } from '../../api/messages'
import { useMe } from '../../api/auth'
import { useProfile } from '../../api/profile'
import { ACHIEVEMENTS_SFW, TROPHIES_SFW } from '../../lib/collectiblesEngine'
import { SFW_TITLES, titleName } from '../../lib/titles'
import { usePointsStats } from './usePointsStats'

/** Roda os checks de desbloqueio (títulos, conquistas, troféus) e dispara mensagem quando algo novo é atingido. */
export function useSyncCollectibles() {
  const stats = usePointsStats()
  const { data: me } = useMe(true)
  const { data: profile } = useProfile()
  const { data: unlockedAch = [] } = useUnlockedAchievements()
  const unlockAch = useUnlockAchievement()
  const { data: unlockedTro = [] } = useUnlockedTrophies()
  const unlockTro = useUnlockTrophy()
  const { data: unlockedTit = [] } = useUnlockedTitles()
  const unlockTit = useUnlockTitle()
  const createMessage = useCreateMessage()

  useEffect(() => {
    const achKeys = new Set(unlockedAch.map((a) => a.achievementKey))
    for (const a of ACHIEVEMENTS_SFW) {
      if (!achKeys.has(a.key) && a.isMet(stats)) {
        unlockAch.mutate(a.key)
        createMessage.mutate({ icon: a.icon, title: 'Nova conquista!', body: `${a.title} — ${a.description}` })
      }
    }

    const troKeys = new Set(unlockedTro.map((t) => t.trophyKey))
    for (const t of TROPHIES_SFW) {
      if (!troKeys.has(t.key) && t.isMet(stats)) {
        unlockTro.mutate(t.key)
        createMessage.mutate({ icon: t.icon, title: 'Novo troféu!', body: `${t.title} — ${t.description}` })
      }
    }

    const titKeys = new Set(unlockedTit.map((t) => t.titleKey))
    for (const t of SFW_TITLES) {
      if (!titKeys.has(t.key) && stats.brilho >= t.threshold) {
        unlockTit.mutate({ key: t.key, track: 'sfw' })
        createMessage.mutate({ icon: t.icon, title: 'Novo título!', body: `Você desbloqueou "${titleName(t, profile?.textStyle)}"` })
      }
    }

    // Beta Tester não é mais concedido automaticamente pra quem entra agora — só quem já tinha continua com o título.
    if (me?.isAdmin && !titKeys.has('criadora')) {
      unlockTit.mutate({ key: 'criadora', track: 'special' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.brilho, me?.id])
}
