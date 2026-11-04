import { Home, Image, Users, User, Sparkles, Store, ListChecks, Calendar, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export interface NavItem {
  to: string
  label: string
  Icon: typeof Home
  /** padrão extra de rota que também marca o item como ativo */
  match?: string
}

/** Abas principais — barra de baixo no celular, topo da barra lateral no PC. */
export function useMainNavItems(): NavItem[] {
  const { t } = useTranslation()
  return [
    { to: '/', label: t('nav.home'), Icon: Home },
    { to: '/feed', label: t('nav.explore'), Icon: Image },
    { to: '/comunidades', label: t('nav.communities'), Icon: Users, match: '/comunidade*' },
  ]
}

/** Atalhos secundários — gaveta do avatar no celular, parte de baixo da barra lateral no PC. */
export function useSecondaryNavItems(): NavItem[] {
  const { t } = useTranslation()
  return [
    { to: '/perfil', label: t('nav.profile'), Icon: User },
    { to: '/pontos', label: t('nav.points'), Icon: Sparkles },
    { to: '/loja', label: t('nav.shop'), Icon: Store },
    { to: '/routines', label: t('nav.routines'), Icon: ListChecks },
    { to: '/calendar', label: t('nav.history'), Icon: Calendar },
    { to: '/settings', label: t('nav.settings'), Icon: Settings },
  ]
}
