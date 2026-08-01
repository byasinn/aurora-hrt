import { Link } from 'react-router-dom'
import { Pill, Ruler, FlaskConical, Lightbulb } from 'lucide-react'
import { Card, ScreenTitle } from '../../components/ui'

const LINKS = [
  { to: '/medications', label: 'Doses / Remédios', icon: Pill },
  { to: '/measurements', label: 'Medidas', icon: Ruler },
  { to: '/labs', label: 'Exames', icon: FlaskConical },
  { to: '/tips', label: 'Dicas', icon: Lightbulb },
]

export default function SaudeScreen() {
  return (
    <div className="space-y-4">
      <ScreenTitle>Saúde</ScreenTitle>
      <div className="grid grid-cols-2 gap-3">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="flex flex-col items-center gap-2 py-6 text-center">
              <Icon size={24} className="text-[var(--accent)]" />
              <span className="text-sm font-medium text-[var(--text)]">{label}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
