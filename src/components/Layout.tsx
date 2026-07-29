import { NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/', label: 'Hoje', icon: '📅' },
  { to: '/mood', label: 'Humor', icon: '💜' },
  { to: '/calendar', label: 'Histórico', icon: '🗓️' },
  { to: '/profile', label: 'Perfil', icon: '👤' },
]

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-[var(--bg)] text-[var(--text)]">
      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-6">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
        <ul className="flex items-stretch justify-around">
          {NAV_ITEMS.map((item) => (
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
        </ul>
      </nav>
    </div>
  )
}
