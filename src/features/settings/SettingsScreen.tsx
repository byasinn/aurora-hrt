import { Link } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { User, Sparkles, Lock, Bell, Globe, FileText, Info, ShieldCheck, ChevronRight } from '../../components/icons'
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{title}</h2>
      {children}
    </section>
  )
}

export default function SettingsScreen() {
  const { t } = useTranslation()
  const { data: me } = useMe(true)

  // Aparência saiu daqui: virou o "Personalizar app" na central do Aurora (tema, visual, itens)
  const ACCOUNT_ROWS: SettingsRowDef[] = [
    { to: '/settings/conta', icon: User, pixel: 'user', label: t('settingsMenu.account'), description: t('settingsMenu.accountDesc') },
    { to: '/settings/perfil', icon: Sparkles, pixel: 'sparkle', label: t('settingsMenu.profile'), description: t('settingsMenu.profileDesc') },
    { to: '/settings/preferencias', icon: SlidersHorizontal, pixel: 'checklistColor', label: t('settingsMenu.preferences'), description: t('settingsMenu.preferencesDesc') },
    { to: '/settings/privacidade', icon: Lock, pixel: 'lock', label: t('settingsMenu.privacy'), description: t('settingsMenu.privacyDesc') },
  ]
  const GENERAL_ROWS: SettingsRowDef[] = [
    { to: '/settings/notificacoes', icon: Bell, pixel: 'bell', label: t('settingsMenu.notifications'), description: t('settingsMenu.notificationsDesc') },
    { to: '/settings/idioma', icon: Globe, pixel: 'globe', label: t('settingsMenu.language'), description: t('settingsMenu.languageDesc') },
    { to: '/settings/dados', icon: FileText, pixel: 'file', label: t('settingsMenu.dataLegal'), description: t('settingsMenu.dataLegalDesc') },
    { to: '/settings/sobre', icon: Info, pixel: 'info', label: t('settingsMenu.about'), description: t('settingsMenu.aboutDesc') },
  ]

  return (
    <div className="space-y-5">
      <ScreenTitle>{t('settingsMenu.title')}</ScreenTitle>
      <Section title={t('settingsMenu.sectionAccount')}>
        {ACCOUNT_ROWS.map((row) => (
          <SettingsRow key={row.to} {...row} />
        ))}
      </Section>
      <Section title={t('settingsMenu.sectionGeneral')}>
        {GENERAL_ROWS.map((row) => (
          <SettingsRow key={row.to} {...row} />
        ))}
      </Section>
      {me?.isAdmin && (
        <SettingsRow to="/admin" icon={ShieldCheck} pixel="shield" label={t('settingsMenu.admin')} description={t('settingsMenu.adminDesc')} />
      )}
    </div>
  )
}
