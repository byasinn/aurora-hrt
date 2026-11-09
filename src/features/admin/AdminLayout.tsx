import { NavLink, Navigate, Outlet, Link } from 'react-router-dom'
import clsx from 'clsx'
import { BarChart3, Users as UsersIcon, Flag, ImageOff, Newspaper, Megaphone, Compass, ArrowLeft, ScrollText } from 'lucide-react'
import { useMe } from '../../api/auth'
import { useAdminStats } from '../../api/adminPanel'
import LoadingScreen from '../../components/LoadingScreen'

// Painel de administração: tela cheia, fora do layout do app. No PC tem barra lateral fixa e conteúdo
// largo (tabelas); no celular vira um topo com abas roláveis — dá pra resolver denúncia e quarentena
// pelo celular também.

const SECTIONS = [
  { to: '/admin', label: 'Visão geral', icon: BarChart3, end: true },
  { to: '/admin/usuarios', label: 'Usuários', icon: UsersIcon },
  { to: '/admin/denuncias', label: 'Denúncias', icon: Flag, badge: 'reports' as const },
  { to: '/admin/quarentena', label: 'Imagens barradas', icon: ImageOff, badge: 'quarantine' as const },
  { to: '/admin/conteudo', label: 'Conteúdo recente', icon: Newspaper },
  { to: '/admin/registro', label: 'Registro', icon: ScrollText },
  { to: '/admin/avisos', label: 'Avisos de versão', icon: Megaphone },
  { to: '/admin/topicos', label: 'Tópicos e fontes', icon: Compass },
]

function Badge({ value }: { value: number | undefined }) {
  if (!value) return null
  return <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-5 text-white">{value}</span>
}

export default function AdminLayout() {
  const { data: me, isLoading } = useMe(true)
  const { data: stats } = useAdminStats()

  if (isLoading) return <LoadingScreen />
  if (!me?.isAdmin) return <Navigate to="/" replace />

  const badgeValue = (b?: 'reports' | 'quarantine') => (b === 'reports' ? stats?.pendingReports : b === 'quarantine' ? stats?.pendingQuarantine : undefined)

  return (
    <div className="min-h-app bg-[var(--bg)] text-[var(--text)] lg:flex">
      <aside className="sticky top-0 hidden h-app w-60 shrink-0 flex-col gap-1 border-r border-[var(--border)] bg-[var(--surface)] p-4 lg:flex">
        <Link to="/" className="mb-4 flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
          <ArrowLeft size={16} /> Voltar ao app
        </Link>
        <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Administração</p>
        {SECTIONS.map((s) => (
          <NavLink
            key={s.to}
            to={s.to}
            end={s.end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition',
                isActive ? 'bg-[var(--accent-soft)] text-[var(--text)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]',
              )
            }
          >
            <s.icon size={17} />
            {s.label}
            <Badge value={badgeValue(s.badge)} />
          </NavLink>
        ))}
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/95 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
          <div className="flex items-center gap-2 px-4 py-2">
            <Link to="/" aria-label="Voltar ao app" className="p-1 text-[var(--text-muted)]">
              <ArrowLeft size={20} />
            </Link>
            <p className="font-bold">Administração</p>
          </div>
          <nav className="flex gap-1.5 overflow-x-auto px-4 pb-2">
            {SECTIONS.map((s) => (
              <NavLink
                key={s.to}
                to={s.to}
                end={s.end}
                className={({ isActive }) =>
                  clsx(
                    'flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium',
                    isActive ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]' : 'border-[var(--border)] text-[var(--text-muted)]',
                  )
                }
              >
                <s.icon size={15} />
                {s.label}
                {!!badgeValue(s.badge) && <span className="rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">{badgeValue(s.badge)}</span>}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl p-4 pb-16 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
