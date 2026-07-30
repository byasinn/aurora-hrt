import { NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'
import { useProfile } from '../api/profile'
import Avatar from './Avatar'

const NAV_ITEMS: { to: string; label: string; icon: string; module?: string }[] = [
  { to: '/', label: 'Home', icon: '✅' },
  { to: '/medications', label: 'Remédios', icon: '💊', module: 'medications' },
  { to: '/mood', label: 'Humor', icon: '💜', module: 'mood' },
  { to: '/feed', label: 'Feed', icon: '🖼️' },
]

export default function Layout() {
  const { data: profile } = useProfile()
  const enabledModules = (profile?.enabledModules as string[] | undefined) ?? [
    'medications',
    'mood',
    'calendar',
    'measurements',
  ]
  const visibleItems = NAV_ITEMS.filter((item) => !item.module || enabledModules.includes(item.module))

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col text-[var(--text)]">
      <header className="flex justify-center pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <span className="font-logo flag-gradient-text text-lg uppercase tracking-wide">Aurora</span>
      </header>
      <main className="flex-1 overflow-y-auto px-4 pb-24">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
        <ul className="flex items-stretch justify-around">
          {visibleItems.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex flex-col items-center gap-0.5 py-2.5 text-xs transition',
                    isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
                  )
                }
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
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
              Perfil
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  )
}
