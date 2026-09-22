import { Link } from 'react-router-dom'
import { ChevronRight, Ban } from 'lucide-react'
import { Card } from '../../components/ui'
import Switch from '../../components/Switch'
import { useProfile, useUpdateProfile } from '../../api/profile'
import SettingsSubHeader from './SettingsSubHeader'

export default function PrivacySettingsScreen() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()

  return (
    <div className="space-y-4">
      <SettingsSubHeader title="Privacidade" />

      <Card className="space-y-2">
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--text)]">Conta privada</p>
            <p className="text-xs text-[var(--text-muted)]">
              Só quem você aprovar consegue seguir e ver seus posts e estatísticas.
            </p>
          </div>
          <Switch
            checked={profile?.isPrivate ?? false}
            onChange={(v) => updateProfile.mutate({ isPrivate: v })}
          />
        </div>
      </Card>

      <Card className="space-y-2">
        <p className="text-xs text-[var(--text-muted)]">
          O que quiser compartilhar no seu perfil público, pra quem te segue.
        </p>
        <div className="flex items-center justify-between gap-3 py-1">
          <span className="min-w-0 flex-1 text-sm text-[var(--text)]">Humor médio</span>
          <Switch
            checked={profile?.shareAvgMood ?? false}
            onChange={(v) => updateProfile.mutate({ shareAvgMood: v })}
          />
        </div>
        <div className="flex items-center justify-between gap-3 py-1">
          <span className="min-w-0 flex-1 text-sm text-[var(--text)]">Libido média</span>
          <Switch
            checked={profile?.shareLibido ?? false}
            onChange={(v) => updateProfile.mutate({ shareLibido: v })}
          />
        </div>
        <div className="flex items-center justify-between gap-3 py-1">
          <span className="min-w-0 flex-1 text-sm text-[var(--text)]">O que toma (medicamentos ativos)</span>
          <Switch
            checked={profile?.shareMedications ?? false}
            onChange={(v) => updateProfile.mutate({ shareMedications: v })}
          />
        </div>
        <div className="flex items-center justify-between gap-3 py-1">
          <span className="min-w-0 flex-1 text-sm text-[var(--text)]">Tempo de hormonioterapia</span>
          <Switch
            checked={profile?.shareHrtDuration ?? false}
            onChange={(v) => updateProfile.mutate({ shareHrtDuration: v })}
          />
        </div>
      </Card>

      <Link to="/settings/bloqueios">
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
            <Ban size={18} />
          </span>
          <span className="flex-1 font-medium text-[var(--text)]">Contas bloqueadas</span>
          <ChevronRight size={18} className="text-[var(--text-muted)]" />
        </Card>
      </Link>
    </div>
  )
}
