import { Home, Image, Users, User, Sparkles, Store, Gem, ListChecks, Calendar, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { PixelIconName } from './PixelIcon'

export interface NavItem {
  to: string
  label: string
  Icon: typeof Home
  /** versão pixel art do ícone (src/components/AppIcon.tsx) */
  pixel?: PixelIconName
  /** padrão extra de rota que também marca o item como ativo */
  match?: string
}

/** Abas principais — barra de baixo no celular, topo da barra lateral no PC. */
export function useMainNavItems(): NavItem[] {
  const { t } = useTranslation()
  return [
    { to: '/', label: t('nav.home'), Icon: Home, pixel: 'homeColor' },
    { to: '/feed', label: t('nav.explore'), Icon: Image, pixel: 'compass' },
    { to: '/comunidades', label: t('nav.communities'), Icon: Users, pixel: 'usersColor', match: '/comunidade*' },
  ]
}

/** Atalhos secundários — gaveta do avatar no celular, parte de baixo da barra lateral no PC. */
export function useSecondaryNavItems(): NavItem[] {
  const { t } = useTranslation()
  return [
    { to: '/perfil', label: t('nav.profile'), Icon: User, pixel: 'user' },
    { to: '/pontos', label: t('nav.points'), Icon: Sparkles, pixel: 'star' },
    { to: '/loja', label: t('nav.shop'), Icon: Store, pixel: 'bag' },
    { to: '/meus-itens', label: t('nav.myItems'), Icon: Gem, pixel: 'sparkle' },
    { to: '/routines', label: t('nav.routines'), Icon: ListChecks, pixel: 'checklistColor' },
    { to: '/calendar', label: t('nav.history'), Icon: Calendar, pixel: 'calendarColor' },
    { to: '/settings', label: t('nav.settings'), Icon: Settings, pixel: 'gearColor' },
  ]
}
