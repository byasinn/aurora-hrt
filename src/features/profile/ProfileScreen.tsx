import { Link } from 'react-router-dom'
import { Settings, ChevronRight, Sparkles, HeartPulse, Calendar, ListChecks, Users, Dumbbell } from 'lucide-react'
import { Card } from '../../components/ui'
import Avatar from '../../components/Avatar'
import CardGrid from '../../components/CardGrid'
import SupportAppCard from '../../components/SupportAppCard'
import { useProfile } from '../../api/profile'
import { useDoseLogs } from '../../api/doses'
import { useMoodEntries } from '../../api/moods'
import { useRoutines, useRoutineLogs } from '../../api/routines'
import { usePointsStats } from '../points/usePointsStats'
import { currentTitle, titleName } from '../../lib/titles'
import { getCollectibleIcon } from '../../lib/collectibleIcons'
import { computeWeeklySummary } from '../../lib/insights'
import { todayStr } from '../../lib/dateUtils'

const BASE_QUICK_LINKS = [
  { to: '/saude', label: 'Saúde', icon: HeartPulse },
  { to: '/routines', label: 'Rotinas', icon: ListChecks },
  { to: '/calendar', label: 'Histórico', icon: Calendar },
  { to: '/comunidades', label: 'Comunidades', icon: Users },
  { to: '/pontos', label: 'Pontos', icon: Sparkles },
]

export default function ProfileScreen() {
  const { data: profile } = useProfile()
  let quickLinks = BASE_QUICK_LINKS as { to: string; label: string; icon: typeof HeartPulse }[]
  if (profile?.workoutsEnabled) quickLinks = [...quickLinks, { to: '/treinos', label: 'Treinos', icon: Dumbbell }]
  const pointsStats = usePointsStats()
  const sfwTitle = currentTitle(pointsStats.brilho)
  const SfwTitleIcon = getCollectibleIcon(sfwTitle.icon)
  const { data: doseLogs = [] } = useDoseLogs()
  const { data: moodEntries = [] } = useMoodEntries()
  const weekly = computeWeeklySummary({ doseLogs, moodEntries })

  const today = todayStr()
  const { data: routines = [] } = useRoutines()
  const { data: routineLogsToday = [] } = useRoutineLogs({ from: today, to: today })
  const activeRoutines = routines.filter((r) => r.active)
  const routinesDoneToday = activeRoutines.filter((r) => {
    const log = routineLogsToday.find((l) => l.routineId === r.id)
    if (!log) return false
    return r.type === 'checkbox' ? log.count > 0 : r.targetCount != null && log.count >= r.targetCount
  }).length

  return (
    <div className="space-y-5">
      <div className="relative">
        <Link to="/perfil">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] [box-shadow:var(--shadow)]">
            <div className="relative h-20 overflow-hidden rounded-t-2xl">
              {profile?.coverUrl ? (
                <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flag-gradient h-full w-full" />
              )}
            </div>
            <div className="relative z-10 -mt-8 px-4 pb-4">
              <Avatar
                src={profile?.avatarUrl}
                icon={profile?.avatarIcon}
                name={profile?.displayName}
                size={64}
                ring={false}
                className="ring-4 ring-[var(--surface)]"
              />
              <p className="mt-2 font-semibold text-[var(--text)]">{profile?.displayName || 'Sem nome ainda'}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {profile?.bio || profile?.pronouns || 'Toque para completar seu perfil'}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  {SfwTitleIcon ? <SfwTitleIcon size={12} /> : <Sparkles size={12} />}
                  {pointsStats.brilho} · {titleName(sfwTitle, profile?.textStyle)}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent)]">
                  Ver perfil completo
                  <ChevronRight size={14} />
                </span>
              </div>
            </div>
          </div>
        </Link>
        <Link
          to="/settings"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] [box-shadow:var(--shadow)]"
        >
          <Settings size={19} />
        </Link>
      </div>

      <CardGrid
        items={quickLinks}
        maxPerRow={3}
        keyFor={(item) => item.to}
        renderItem={({ to, label, icon: Icon }) => (
          <Link to={to}>
            <Card className="flex flex-col items-center gap-1 py-3 text-center">
              <Icon size={20} className="text-[var(--accent)]" />
              <span className="text-[11px] font-medium text-[var(--text)]">{label}</span>
            </Card>
          </Link>
        )}
      />

      <SupportAppCard />

      <Card className="space-y-2">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Resumo da semana</h2>
        <p className="text-sm text-[var(--text)]">
          {weekly.dosesTracked > 0
            ? `${weekly.dosesTaken}/${weekly.dosesTracked} doses em dia`
            : 'Nenhuma dose registrada ainda'}
          {' · '}
          {weekly.moodCheckIns} check-in{weekly.moodCheckIns === 1 ? '' : 's'} de humor
          {activeRoutines.length > 0 && (
            <>
              {' · '}
              {routinesDoneToday}/{activeRoutines.length} rotinas hoje
            </>
          )}
        </p>
        {(weekly.avgEnergy !== null || weekly.avgLibido !== null) && (
          <p className="text-xs text-[var(--text-muted)]">
            {weekly.avgEnergy !== null && `Energia média: ${weekly.avgEnergy.toFixed(1)}/10`}
            {weekly.avgEnergy !== null && weekly.avgLibido !== null && ' · '}
            {weekly.avgLibido !== null && `Libido média: ${weekly.avgLibido.toFixed(1)}/10`}
          </p>
        )}
        <Link to="/pontos" className="inline-block text-xs text-[var(--accent)]">
          Ver pontos, títulos e troféus →
        </Link>
      </Card>
    </div>
  )
}
