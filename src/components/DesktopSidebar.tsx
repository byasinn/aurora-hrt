import { NavLink, matchPath, useLocation } from 'react-router-dom'
import { MessageCircle, User } from './icons'
import AuroraLogo from './AuroraLogo'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import Avatar from './Avatar'
import AppIcon, { useIconStyle } from './AppIcon'
import PixelIcon from './PixelIcon'
import { HUB_PATHS, useMainNavItems, useSecondaryNavItems, type NavItem } from './navItems'
import { playSound } from '../lib/sounds'
import type { Profile } from '../../shared/types'

function SidebarLink({
  item,
  active,
  badge,
  icon,
  small,
}: {
  item: NavItem
  active?: boolean
  badge?: number
  /** troca o ícone padrão (ex.: avatar no Meu espaço) */
  icon?: React.ReactNode
  small?: boolean
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
          'flex items-center gap-3 rounded-2xl px-3 font-bold transition',
          small ? 'min-h-10 text-sm' : 'min-h-11 text-[15px]',
          isActive || extraActive
            ? 'bg-[var(--accent-soft)] text-[var(--text)]'
            : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
        )
      }
    >
      {({ isActive }) => (
        <>
          {icon ?? <AppIcon icon={Icon} pixel={pixel} size={small ? 19 : 22} className={isActive || extraActive ? 'text-[var(--accent)]' : undefined} />}
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

/** O botão da central do Aurora — no celular é o botão grande do meio da barra de baixo. */
function AuroraButton() {
  const location = useLocation()
  const iconStyle = useIconStyle((s) => s.style)
  const active = HUB_PATHS.some((p) => location.pathname.startsWith(p))
  return (
    <NavLink
      to="/aurora"
      onClick={() => playSound('pop')}
      className={clsx(
        'btn-press flex items-center gap-3 rounded-2xl p-2 pr-3 text-white transition',
        active ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]' : 'hover:brightness-105',
      )}
      style={{ background: 'linear-gradient(120deg, var(--accent-3, var(--accent)), var(--accent-2) 55%, var(--accent))' }}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/25 p-[3px]">
        {iconStyle === 'pixel' ? (
          <span className="flex h-full w-full items-center justify-center rounded-lg bg-[var(--surface)]">
            <PixelIcon name="butterfly" size={26} />
          </span>
        ) : (
          <img src="/icons/icon-192.png" alt="" className="h-full w-full rounded-lg object-cover" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-extrabold leading-tight">Aurora</span>
        <span className="block truncate text-xs text-white/85">Missões, lojinha e mais</span>
      </span>
    </NavLink>
  )
}

/** Navegação do PC (≥1024px): tudo que no celular fica na barra de baixo, mais atalhos. */
export default function DesktopSidebar({ profile, unread }: { profile: Profile | undefined; unread: number }) {
  const { t } = useTranslation()
  const location = useLocation()
  const main = useMainNavItems()
  const secondary = useSecondaryNavItems()
  const inboxActive = location.pathname === '/inbox' || location.pathname.startsWith('/conversas')
  const spaceActive = location.pathname === '/profile'

  return (
    <aside className="sticky top-0 hidden h-app w-64 shrink-0 flex-col gap-4 overflow-y-auto py-6 pl-6 pr-2 lg:flex">
      <AuroraLogo height={28} className="mx-3 mb-1" />

      <AuroraButton />

      <nav className="space-y-0.5">
        {main.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
        <SidebarLink item={{ to: '/inbox', label: t('nav.messages'), Icon: MessageCircle, pixel: 'chatColor' }} active={inboxActive} badge={unread} />
        <SidebarLink
          item={{ to: '/profile', label: t('nav.mySpace'), Icon: User }}
          active={spaceActive}
          icon={<Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} frame={profile?.equippedAvatarFrame} size={24} />}
        />
      </nav>

      <nav className="space-y-0.5 border-t border-[var(--border)] pt-3">
        {secondary.map((item) => (
          <SidebarLink key={item.to} item={item} small />
        ))}
      </nav>

      <NavLink
        to="/perfil"
        onClick={() => playSound('tap')}
        className="mt-auto flex shrink-0 items-center gap-3 rounded-2xl p-2 hover:bg-[var(--surface-2)]"
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
