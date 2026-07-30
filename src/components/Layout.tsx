import { NavLink, Outlet } from 'react-router-dom'
import { Home, Image, UserCircle2 } from 'lucide-react'
import clsx from 'clsx'
import { useProfile } from '../api/profile'
import Avatar from './Avatar'
import InsightMessageGenerator from './InsightMessageGenerator'

const NAV_ITEMS = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/feed', label: 'Explorar', Icon: Image },
]

export default function Layout() {
  const { data: profile } = useProfile()

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col text-[var(--text)]">
      <InsightMessageGenerator />
      <header className="flex justify-center pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <span className="font-logo flag-gradient-text text-lg uppercase tracking-wide">Aurora</span>
      </header>
      <main className="flex-1 overflow-y-auto px-4 pb-24">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
        <ul className="flex items-stretch justify-around">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex flex-col items-center gap-0.5 py-2.5 text-xs transition',
                    isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
                  )
                }
              >
                <Icon size={22} />
                {label}
              </NavLink>
            </li>
          ))}
          <li className="flex-1">
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-0.5 py-2.5 text-xs transition',
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
                )
              }
            >
              <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} size={22} />
              Meu espaço
            </NavLink>
          </li>
          <li className="flex-1">
            <NavLink
              to="/perfil"
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-0.5 py-2.5 text-xs transition',
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
                )
              }
            >
              <UserCircle2 size={22} />
              Perfil
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  )
}
