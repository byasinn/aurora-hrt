import { useState } from 'react'
import { NavLink, Outlet, useLocation, matchPath } from 'react-router-dom'
import { Home, Image, Users, MessageCircle } from 'lucide-react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { useProfile } from '../api/profile'
import { useMessages } from '../api/messages'
import { useConversations } from '../api/dm'
import Avatar from './Avatar'
import InsightMessageGenerator from './InsightMessageGenerator'
import NavDrawer from './NavDrawer'
import AnnouncementModal from './AnnouncementModal'

export default function Layout() {
  const { t } = useTranslation()
  const NAV_ITEMS: { to: string; label: string; Icon: typeof Home; match?: string }[] = [
    { to: '/', label: t('nav.home'), Icon: Home },
    { to: '/feed', label: t('nav.explore'), Icon: Image },
    { to: '/comunidades', label: t('nav.communities'), Icon: Users, match: '/comunidade*' },
  ]
  const { data: profile } = useProfile()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const spaceActive = location.pathname === '/profile' || location.pathname === '/perfil'
  const inboxActive = location.pathname === '/inbox' || location.pathname.startsWith('/conversas')

  const { data: messages } = useMessages()
  const { data: threads } = useConversations()
  const unread = (messages?.filter((m) => !m.read).length ?? 0) + (threads?.reduce((sum, t) => sum + t.unreadCount, 0) ?? 0)

  return (
    <div className="mx-auto flex min-h-app w-full max-w-md flex-col text-[var(--text)]">
      <InsightMessageGenerator />
      <AnnouncementModal />
      <header className="relative flex items-center justify-center pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          onClick={() => setDrawerOpen(true)}
          className="absolute left-4 top-[max(0.75rem,env(safe-area-inset-top))]"
        >
          <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} size={28} />
        </button>
        <span className="font-logo flag-gradient-text text-lg uppercase tracking-wide">Aurora</span>
      </header>
      <main className="flex-1 overflow-y-auto overscroll-y-contain px-4 pb-24">
        <Outlet />
      </main>
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} profile={profile} />
      <nav className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
        <ul className="flex items-stretch justify-around">
          {NAV_ITEMS.map(({ to, label, Icon, match }) => {
            const extraActive = match ? !!matchPath(match, location.pathname) : false
            return (
              <li key={to} className="flex-1">
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    clsx(
                      'flex flex-col items-center gap-0.5 py-2.5 text-xs transition',
                      isActive || extraActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
                    )
                  }
                >
                  <Icon size={22} />
                  {label}
                </NavLink>
              </li>
            )
          })}
          <li className="flex-1">
            <NavLink
              to="/inbox"
              className={clsx(
                'relative flex flex-col items-center gap-0.5 py-2.5 text-xs transition',
                inboxActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
              )}
            >
              <span className="relative">
                <MessageCircle size={22} />
                {unread > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-medium text-white">
                    {unread}
                  </span>
                )}
              </span>
              {t('nav.messages')}
            </NavLink>
          </li>
          <li className="flex-1">
            <NavLink
              to="/profile"
              className={clsx(
                'flex flex-col items-center gap-0.5 py-2.5 text-xs transition',
                spaceActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
              )}
            >
              <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} size={22} />
              {t('nav.mySpace')}
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  )
}
