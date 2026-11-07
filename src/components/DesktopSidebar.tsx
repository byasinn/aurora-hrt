import { NavLink, matchPath, useLocation } from 'react-router-dom'
import { MessageCircle, User } from 'lucide-react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import Avatar from './Avatar'
import AppIcon from './AppIcon'
import { useMainNavItems, useSecondaryNavItems, type NavItem } from './navItems'
import { playSound } from '../lib/sounds'
import type { Profile } from '../../shared/types'

function SidebarLink({
  item,
  active,
  badge,
  icon,
}: {
  item: NavItem
  active?: boolean
  badge?: number
  /** troca o ícone padrão (ex.: avatar no Meu espaço) */
  icon?: React.ReactNode
}) {
  const { to, label, Icon, pixel, match } = item
  const location = useLocation()
  const extraActive = active ?? (match ? !!matchPath(match, location.pathname) : false)
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={() => playSound('tap')}
      className={({ isActive }) =>
        clsx(
          'flex min-h-12 items-center gap-3 rounded-2xl px-3 text-[15px] font-bold transition',
          isActive || extraActive
            ? 'bg-[var(--accent-soft)] text-[var(--text)]'
            : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
        )
      }
    >
      {({ isActive }) => (
        <>
          {icon ?? <AppIcon icon={Icon} pixel={pixel} size={22} className={isActive || extraActive ? 'text-[var(--accent)]' : undefined} />}
          <span className="flex-1">{label}</span>
          {!!badge && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

/** Navegação do PC (≥1024px): tudo que no celular fica dividido entre a barra de baixo e a gaveta. */
export default function DesktopSidebar({ profile, unread }: { profile: Profile | undefined; unread: number }) {
  const { t } = useTranslation()
  const location = useLocation()
  const main = useMainNavItems()
  const secondary = useSecondaryNavItems()
  const inboxActive = location.pathname === '/inbox' || location.pathname.startsWith('/conversas')
  const spaceActive = location.pathname === '/profile'

  return (
    <aside className="sticky top-0 hidden h-app w-64 shrink-0 flex-col gap-6 overflow-y-auto py-8 pl-6 pr-2 lg:flex">
      <span className="font-logo flag-gradient-text px-3 text-2xl uppercase tracking-wide">Aurora</span>

      <nav className="space-y-1">
        {main.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
        <SidebarLink item={{ to: '/inbox', label: t('nav.messages'), Icon: MessageCircle, pixel: 'chat' }} active={inboxActive} badge={unread} />
        <SidebarLink
          item={{ to: '/profile', label: t('nav.mySpace'), Icon: User }}
          active={spaceActive}
          icon={<Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} frame={profile?.equippedAvatarFrame} size={24} />}
        />
      </nav>

      <nav className="space-y-1 border-t border-[var(--border)] pt-4">
        {secondary.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
      </nav>

      <NavLink
        to="/perfil"
        onClick={() => playSound('tap')}
        className="mt-auto flex items-center gap-3 rounded-2xl p-2 hover:bg-[var(--surface-2)]"
      >
        <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} frame={profile?.equippedAvatarFrame} size={40} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-[var(--text)]">{profile?.displayName}</span>
          <span className="block text-xs text-[var(--text-muted)]">{t('nav.profile')}</span>
        </span>
      </NavLink>
    </aside>
  )
}
