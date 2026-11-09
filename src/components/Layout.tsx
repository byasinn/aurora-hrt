import { useEffect } from 'react'
import { NavLink, Outlet, useLocation, matchPath } from 'react-router-dom'
import AuroraLogo from './AuroraLogo'
import { MessageCircle } from './icons'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { useProfile } from '../api/profile'
import { useMessages } from '../api/messages'
import { useConversations } from '../api/dm'
import { playSound } from '../lib/sounds'
import Avatar from './Avatar'
import AppIcon, { useIconStyle } from './AppIcon'
import PixelIcon from './PixelIcon'
import InsightMessageGenerator from './InsightMessageGenerator'
import DesktopSidebar from './DesktopSidebar'
import { useMainNavItems } from './navItems'
import AnnouncementModal from './AnnouncementModal'

function TabItem({ to, label, active, children }: { to: string; label: string; active: boolean; children: React.ReactNode }) {
  return (
    <li className="flex-1">
      <NavLink
        to={to}
        end={to === '/'}
        onClick={() => playSound('tap')}
        className={clsx(
          'flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold transition',
          active ? 'text-[var(--text)]' : 'text-[var(--text-muted)]',
        )}
      >
        {/* pílula atrás do ícone ativo — mais fácil de ver em qual aba está do que só a cor */}
        <span
          className={clsx(
            'relative flex h-8 w-14 items-center justify-center rounded-full transition',
            active ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : '',
          )}
        >
          {children}
        </span>
        {label}
      </NavLink>
    </li>
  )
}

export default function Layout() {
  const { t } = useTranslation()
  const navItems = useMainNavItems()
  const { data: profile } = useProfile()
  const iconStyle = useIconStyle((s) => s.style)
  const location = useLocation()

  // Com o documento rolando, a posição ficaria da tela anterior ao navegar — volta pro topo.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])
  const spaceActive = location.pathname === '/profile' || location.pathname === '/perfil'
  const inboxActive = location.pathname === '/inbox' || location.pathname.startsWith('/conversas')
  const hubActive =
    ['/aurora', '/personalizar', '/missoes', '/loja', '/meus-itens', '/pontos'].some((p) => location.pathname.startsWith(p)) ||
    !!matchPath('/comunidade*', location.pathname)

  const { data: messages } = useMessages()
  const { data: threads } = useConversations()
  const unread = (messages?.filter((m) => !m.read).length ?? 0) + (threads?.reduce((sum, t) => sum + t.unreadCount, 0) ?? 0)

  return (
    <div className="flex justify-center text-[var(--text)]">
      <DesktopSidebar profile={profile} unread={unread} />
      <div className="flex min-h-app w-full max-w-md flex-col lg:max-w-2xl lg:px-8">
        <InsightMessageGenerator />
        <AnnouncementModal />
        {/* Sem foto de perfil aqui: ela ficava por cima do primeiro card. O perfil fica no "Meu espaço"
            da barra de baixo, e o que a gaveta do avatar tinha está no Meu espaço e na central do Aurora. */}
        <header className="flex items-center justify-center pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
          <AuroraLogo height={22} />
        </header>
        {/* Quem rola é o documento, não o <main>. Com overflow-y-auto aqui (sem altura travada) o <main>
            virava um scroll container que nunca rolava, e o overscroll-contain bloqueava a rolagem de
            chegar na página — no PC só rolava com o mouse fora da coluna, no Android às vezes nem isso. */}
        <main className="flex-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:px-0 lg:pb-8 lg:pt-8">
          <Outlet />
        </main>
        <nav className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 rounded-t-3xl border-t border-[var(--border)] bg-[var(--surface)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          <ul className="flex items-stretch justify-around px-1">
            {navItems
              .filter((item) => item.to !== '/comunidades')
              .map(({ to, label, Icon, pixel }) => {
                const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
                return (
                  <TabItem key={to} to={to} label={label} active={active}>
                    <AppIcon icon={Icon} pixel={pixel} size={22} />
                  </TabItem>
                )
              })}
            <li className="flex-1">
              {/* botão grande do meio: central do Aurora (Comunidades, Lojinha, Meus itens, Pontos) */}
              <NavLink
                to="/aurora"
                onClick={() => playSound('pop')}
                aria-label="Aurora"
                className="flex min-h-16 flex-col items-center justify-end gap-1 pb-1.5 text-[11px] font-bold"
              >
                <span
                  className={clsx(
                    '-mt-7 flex h-16 w-16 items-center justify-center rounded-full p-[3px] transition active:scale-95 [box-shadow:var(--shadow)]',
                    hubActive && 'scale-105',
                  )}
                  style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
                >
                  {/* 8-bit: borboleta em pixel art nas cores do tema · Clean: o ícone do app, como era antes */}
                  {iconStyle === 'pixel' ? (
                    <span className="flex h-full w-full items-center justify-center rounded-full bg-[var(--surface)]">
                      <PixelIcon name="butterfly" size={30} />
                    </span>
                  ) : (
                    <img src="/icons/icon-192.png" alt="" className="h-full w-full rounded-full border-2 border-[var(--surface)] object-cover" />
                  )}
                </span>
                <span className={hubActive ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}>Aurora</span>
              </NavLink>
            </li>
            <TabItem to="/inbox" label={t('nav.messages')} active={inboxActive}>
              <AppIcon icon={MessageCircle} pixel="chatColor" size={22} />
              {unread > 0 && (
                <span className="absolute right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </TabItem>
            <TabItem to="/profile" label={t('nav.mySpace')} active={spaceActive}>
              <Avatar
                src={profile?.avatarUrl}
                icon={profile?.avatarIcon}
                name={profile?.displayName}
                frame={profile?.equippedAvatarFrame}
                size={26}
                showOrnaments
              />
            </TabItem>
          </ul>
        </nav>
      </div>
    </div>
  )
}
