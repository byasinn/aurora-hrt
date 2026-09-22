import { Link } from 'react-router-dom'
import {
  User,
  Sparkles,
  Lock,
  Bell,
  Shield,
  Palette,
  Globe,
  FileText,
  Info,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, ScreenTitle } from '../../components/ui'
import { useMe } from '../../api/auth'

interface SettingsRowDef {
  to: string
  icon: typeof User
  label: string
  description: string
}

function SettingsRow({ to, icon: Icon, label, description }: SettingsRowDef) {
  return (
    <Link to={to}>
      <Card className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
          <Icon size={18} />
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
    { to: '/settings/conta', icon: User, label: t('settingsMenu.account'), description: t('settingsMenu.accountDesc') },
    { to: '/settings/perfil', icon: Sparkles, label: t('settingsMenu.profile'), description: t('settingsMenu.profileDesc') },
    { to: '/settings/privacidade', icon: Lock, label: t('settingsMenu.privacy'), description: t('settingsMenu.privacyDesc') },
    { to: '/settings/notificacoes', icon: Bell, label: t('settingsMenu.notifications'), description: t('settingsMenu.notificationsDesc') },
    { to: '/settings/seguranca', icon: Shield, label: t('settingsMenu.security'), description: t('settingsMenu.securityDesc') },
    { to: '/settings/aparencia', icon: Palette, label: t('settingsMenu.appearance'), description: t('settingsMenu.appearanceDesc') },
    { to: '/settings/idioma', icon: Globe, label: t('settingsMenu.language'), description: t('settingsMenu.languageDesc') },
    { to: '/settings/dados', icon: FileText, label: t('settingsMenu.dataLegal'), description: t('settingsMenu.dataLegalDesc') },
    { to: '/settings/sobre', icon: Info, label: t('settingsMenu.about'), description: t('settingsMenu.aboutDesc') },
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
            label={t('settingsMenu.admin')}
            description={t('settingsMenu.adminDesc')}
          />
        )}
      </div>
    </div>
  )
}
