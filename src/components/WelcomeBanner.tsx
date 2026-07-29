import { useProfile } from '../api/profile'
import Avatar from './Avatar'

const MESSAGES = [
  'Um passo de cada vez. 💜',
  'Você está indo bem — continue assim.',
  'Cuidar de si mesma também é isso.',
  'Cada dose é um dia mais perto de você.',
  'Orgulho da sua jornada, hoje e sempre.',
  'Respira. Você está no seu tempo certo.',
]

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Boa noite'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function WelcomeBanner() {
  const { data: profile } = useProfile()
  const dayIndex = new Date().getDate() % MESSAGES.length
  const name = profile?.displayName?.trim()

  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 [box-shadow:var(--shadow)]">
      <Avatar src={profile?.avatarUrl} name={profile?.displayName} size={44} />
      <div>
        <p className="text-sm text-[var(--text-muted)]">
          {greeting()}
          {name ? `, ${name}` : ''}
        </p>
        <p className="text-sm font-medium flag-gradient-text">{MESSAGES[dayIndex]}</p>
      </div>
    </div>
  )
}
