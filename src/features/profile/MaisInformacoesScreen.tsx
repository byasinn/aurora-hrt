import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Pill, Link2 } from 'lucide-react'
import { Card, ScreenTitle } from '../../components/ui'

const INFO_LINKS = [
  { to: '/perfil/mais-informacoes/o-que-tomo', label: 'O que eu tomo', icon: Pill },
  { to: '/perfil/mais-informacoes/links', label: 'Sites e redes sociais', icon: Link2 },
]

export default function MaisInformacoesScreen() {
  return (
    <div className="space-y-4">
      <Link to="/perfil" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ChevronLeft size={16} /> Perfil
      </Link>
      <ScreenTitle>Mais informações</ScreenTitle>

      <div className="space-y-2">
        {INFO_LINKS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
                <Icon size={18} />
              </span>
              <span className="flex-1 font-medium text-[var(--text)]">{label}</span>
              <ChevronRight size={18} className="text-[var(--text-muted)]" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
