import { Link } from 'react-router-dom'
import { User, Sparkles, Lock, Bell, Shield, Palette, Globe, FileText, Info, ShieldCheck, ChevronRight } from '../../components/icons'
import { useTranslation } from 'react-i18next'
import { Card, ScreenTitle } from '../../components/ui'
import { useMe } from '../../api/auth'
import AppIcon from '../../components/AppIcon'
import type { PixelIconName } from '../../components/PixelIcon'

interface SettingsRowDef {
  to: string
  icon: typeof User
  pixel?: PixelIconName
  label: string
  description: string
}

function SettingsRow({ to, icon: Icon, pixel, label, description }: SettingsRowDef) {
  return (
    <Link to={to}>
      <Card className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <AppIcon icon={Icon} pixel={pixel} size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-[var(--text)]">{label}</span>
          <span className="block truncate text-xs text-[var(--text-muted)]">{description}</span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-[var(--text-muted)]" />
      </Card>
    </Link>
  )
}

export default function SettingsScreen() {
  const { t } = useTranslation()
  const { data: me } = useMe(true)

  const ROWS: SettingsRowDef[] = [
    { to: '/settings/conta', icon: User, pixel: 'user', label: t('settingsMenu.account'), description: t('settingsMenu.accountDesc') },
    { to: '/settings/perfil', icon: Sparkles, pixel: 'sparkle', label: t('settingsMenu.profile'), description: t('settingsMenu.profileDesc') },
    { to: '/settings/privacidade', icon: Lock, pixel: 'lock', label: t('settingsMenu.privacy'), description: t('settingsMenu.privacyDesc') },
    { to: '/settings/notificacoes', icon: Bell, pixel: 'bell', label: t('settingsMenu.notifications'), description: t('settingsMenu.notificationsDesc') },
    { to: '/settings/seguranca', icon: Shield, pixel: 'shield', label: t('settingsMenu.security'), description: t('settingsMenu.securityDesc') },
    { to: '/settings/aparencia', icon: Palette, pixel: 'palette', label: t('settingsMenu.appearance'), description: t('settingsMenu.appearanceDesc') },
    { to: '/settings/idioma', icon: Globe, pixel: 'globe', label: t('settingsMenu.language'), description: t('settingsMenu.languageDesc') },
    { to: '/settings/dados', icon: FileText, pixel: 'file', label: t('settingsMenu.dataLegal'), description: t('settingsMenu.dataLegalDesc') },
    { to: '/settings/sobre', icon: Info, pixel: 'info', label: t('settingsMenu.about'), description: t('settingsMenu.aboutDesc') },
  ]

  return (
    <div className="space-y-4">
      <ScreenTitle>{t('settingsMenu.title')}</ScreenTitle>
      <div className="space-y-2">
        {ROWS.map((row) => (
          <SettingsRow key={row.to} {...row} />
        ))}
        {me?.isAdmin && (
          <SettingsRow
            to="/settings/admin"
            icon={ShieldCheck}
            pixel="shield"
            label={t('settingsMenu.admin')}
            description={t('settingsMenu.adminDesc')}
          />
        )}
      </div>
    </div>
  )
}
