import { Home, Image, Users, Gift, Store, ListChecks, Calendar, Settings } from 'lucide-react'
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

/** Atalhos menores da barra lateral do PC (o resto da central do Aurora fica no botão Aurora). */
export function useSecondaryNavItems(): NavItem[] {
  const { t } = useTranslation()
  return [
    { to: '/missoes', label: t('nav.missions'), Icon: Gift, pixel: 'chest' },
    { to: '/loja', label: t('nav.shop'), Icon: Store, pixel: 'bag', match: '/loja/*' },
    { to: '/routines', label: t('nav.routines'), Icon: ListChecks, pixel: 'checklistColor' },
    { to: '/calendar', label: t('nav.history'), Icon: Calendar, pixel: 'calendarColor' },
    { to: '/settings', label: t('nav.settings'), Icon: Settings, pixel: 'gearColor', match: '/settings/*' },
  ]
}

/** Telas que ficam "dentro" do botão Aurora (central) — marcam ele como ativo. */
export const HUB_PATHS = ['/aurora', '/personalizar', '/missoes', '/loja', '/meus-itens', '/pontos']
