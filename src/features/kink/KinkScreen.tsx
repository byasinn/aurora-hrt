import { Link } from 'react-router-dom'
import { Heart, TriangleAlert, Flame, ChevronRight } from 'lucide-react'
import { Card, ScreenTitle } from '../../components/ui'

const HUB_LINKS = [
  { to: '/kink/meus-kinks', label: 'Meus kinks', description: 'O que você curte — pra outros verem no seu perfil', icon: Heart },
  { to: '/kink/punicoes', label: 'Punições', description: 'Modelos prontos com duração — castidade, treinos e mais', icon: TriangleAlert },
  { to: '/kink/masturbacao', label: 'Masturbação', description: 'Ideias, tarefas e rotinas — CEI, treinos e afins', icon: Flame },
]

export default function KinkScreen() {
  return (
    <div className="space-y-4">
      <ScreenTitle>Kink</ScreenTitle>

      <div className="space-y-2">
        {HUB_LINKS.map(({ to, label, description, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
                <Icon size={18} />
              </span>
              <div className="flex-1">
                <p className="font-medium text-[var(--text)]">{label}</p>
                <p className="text-xs text-[var(--text-muted)]">{description}</p>
              </div>
              <ChevronRight size={18} className="text-[var(--text-muted)]" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
