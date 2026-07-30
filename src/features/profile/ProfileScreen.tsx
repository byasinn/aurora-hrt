import { Link } from 'react-router-dom'
import { Settings, ChevronRight, Trophy, Pill, Calendar, Ruler, FlaskConical, Lightbulb } from 'lucide-react'
import { Card } from '../../components/ui'
import Avatar from '../../components/Avatar'
import { useProfile } from '../../api/profile'
import { useUnlockedAchievements } from '../../api/achievements'
import { useDoseLogs } from '../../api/doses'
import { useMoodEntries } from '../../api/moods'
import { computeWeeklySummary } from '../../lib/insights'

const QUICK_LINKS = [
  { to: '/', label: 'Remédios', icon: Pill },
  { to: '/calendar', label: 'Histórico', icon: Calendar },
  { to: '/measurements', label: 'Medidas', icon: Ruler },
  { to: '/labs', label: 'Exames', icon: FlaskConical },
  { to: '/tips', label: 'Dicas', icon: Lightbulb },
]

export default function ProfileScreen() {
  const { data: profile } = useProfile()
  const { data: unlocked = [] } = useUnlockedAchievements()
  const { data: doseLogs = [] } = useDoseLogs()
  const { data: moodEntries = [] } = useMoodEntries()
  const weekly = computeWeeklySummary({ doseLogs, moodEntries })

  return (
    <div className="space-y-5">
      <div className="relative">
        <Link to="/perfil">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] [box-shadow:var(--shadow)]">
            <div className="relative h-20">
              {profile?.coverUrl ? (
                <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flag-gradient h-full w-full" />
              )}
            </div>
            <div className="-mt-8 px-4 pb-4">
              <Avatar
                src={profile?.avatarUrl}
                icon={profile?.avatarIcon}
                name={profile?.displayName}
                size={64}
                className="ring-4 ring-[var(--surface)]"
              />
              <p className="mt-2 font-semibold text-[var(--text)]">{profile?.displayName || 'Sem nome ainda'}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {profile?.bio || profile?.pronouns || 'Toque para completar seu perfil'}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <Trophy size={12} />
                  {unlocked.length} troféu{unlocked.length === 1 ? '' : 's'}
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
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white"
        >
          <Settings size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="flex flex-col items-center gap-1 py-3 text-center">
              <Icon size={20} className="text-[var(--accent)]" />
              <span className="text-[11px] font-medium text-[var(--text)]">{label}</span>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="space-y-2">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Resumo da semana</h2>
        <p className="text-sm text-[var(--text)]">
          {weekly.dosesTracked > 0
            ? `${weekly.dosesTaken}/${weekly.dosesTracked} doses em dia`
            : 'Nenhuma dose registrada ainda'}
          {' · '}
          {weekly.moodCheckIns} check-in{weekly.moodCheckIns === 1 ? '' : 's'} de humor
        </p>
        {(weekly.avgEnergy !== null || weekly.avgLibido !== null) && (
          <p className="text-xs text-[var(--text-muted)]">
            {weekly.avgEnergy !== null && `Energia média: ${weekly.avgEnergy.toFixed(1)}/5`}
            {weekly.avgEnergy !== null && weekly.avgLibido !== null && ' · '}
            {weekly.avgLibido !== null && `Libido média: ${weekly.avgLibido.toFixed(1)}/5`}
          </p>
        )}
        <Link to="/achievements" className="inline-block text-xs text-[var(--accent)]">
          Ver estatísticas completas e troféus →
        </Link>
      </Card>
    </div>
  )
}
