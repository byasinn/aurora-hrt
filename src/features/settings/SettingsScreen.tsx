import { useEffect, useState } from 'react'
import { User, Shield, Bell, Download, Palette, Terminal, LogOut, Lock, Users, Ban } from 'lucide-react'
import { Button, Card, ScreenTitle } from '../../components/ui'
import Switch from '../../components/Switch'
import { useProfile, useUpdateProfile } from '../../api/profile'
import { useMe, useLogout } from '../../api/auth'
import { useAdminUsers, useSetUserBanned } from '../../api/admin'
import { useThemeStore, applyTheme, COLOR_SHORTCUTS } from '../../lib/themeStore'
import { todayStr } from '../../lib/dateUtils'
import { enablePushNotifications, getNotificationPermissionState } from '../../lib/notifications'
import { downloadBackup } from '../../lib/exportData'
import { isFaceIdSupported, isFaceIdEnabled, registerFaceId, disableFaceId } from '../../lib/faceId'

const CONTENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'feminine', label: 'Feminino' },
  { value: 'masculine', label: 'Masculino' },
  { value: 'combined', label: 'Combinado' },
]

function SectionHeader({ icon: Icon, title }: { icon: typeof User; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={16} className="text-[var(--accent)]" />
      <h2 className="text-sm font-medium text-[var(--text-muted)]">{title}</h2>
    </div>
  )
}

function AdminUsersCard({ myId }: { myId?: number }) {
  const { data: allUsers, isLoading } = useAdminUsers(true)
  const setBanned = useSetUserBanned()

  return (
    <Card className="space-y-2">
      <SectionHeader icon={Users} title="Usuários (admin)" />
      <p className="text-xs text-[var(--text-muted)]">
        Cadastro é aberto pra qualquer email — banir aqui é como você controla quem continua com acesso.
      </p>
      {isLoading && <p className="text-xs text-[var(--text-muted)]">Carregando…</p>}
      <div className="space-y-1">
        {allUsers?.map((u) => (
          <div key={u.id} className="flex items-center justify-between py-1">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-[var(--text)]">
                {u.email} {u.isAdmin && <span className="text-[10px] text-[var(--accent)]">admin</span>}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {u.emailVerified ? 'confirmado' : 'não confirmado'} {u.banned && '· banido'}
              </p>
            </div>
            {u.id !== myId && (
              <button
                onClick={() => setBanned.mutate({ id: u.id, banned: !u.banned })}
                disabled={setBanned.isPending}
                className={
                  'flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-xs disabled:opacity-50 ' +
                  (u.banned
                    ? 'border-[var(--border)] text-[var(--text)]'
                    : 'border-red-500/40 text-red-500')
                }
              >
                <Ban size={12} />
                {u.banned ? 'Desbanir' : 'Banir'}
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function SettingsScreen() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const { data: me } = useMe(true)
  const logout = useLogout()
  const theme = useThemeStore()

  const [displayName, setDisplayName] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [transitionStartDate, setTransitionStartDate] = useState('')
  const [pushState, setPushState] = useState<string>('')
  const [faceIdSupported, setFaceIdSupported] = useState(false)
  const [faceIdOn, setFaceIdOn] = useState(false)
  const [faceIdBusy, setFaceIdBusy] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.displayName)
    setPronouns(profile.pronouns)
    setTransitionStartDate(profile.transitionStartDate ?? '')
  }, [profile])

  useEffect(() => {
    getNotificationPermissionState().then(setPushState)
  }, [])

  useEffect(() => {
    isFaceIdSupported().then(setFaceIdSupported)
    setFaceIdOn(isFaceIdEnabled())
  }, [])

  function savePreferences() {
    updateProfile.mutate({ displayName, pronouns, transitionStartDate: transitionStartDate || null })
  }

  async function handleEnablePush() {
    const res = await enablePushNotifications()
    setPushState(res.ok ? 'granted' : (res.reason ?? 'erro'))
  }

  async function handleToggleFaceId(next: boolean) {
    setFaceIdBusy(true)
    try {
      if (!next) {
        disableFaceId()
        setFaceIdOn(false)
      } else {
        const ok = await registerFaceId()
        setFaceIdOn(ok)
      }
    } finally {
      setFaceIdBusy(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      await downloadBackup()
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5">
      <ScreenTitle>Configurações</ScreenTitle>

      <Card className="space-y-3">
        <SectionHeader icon={User} title="Conta" />
        <p className="text-sm text-[var(--text)]">{me?.email}</p>
        <Button
          variant="secondary"
          className="flex w-full items-center justify-center gap-2"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut size={16} />
          {logout.isPending ? 'Saindo…' : 'Sair'}
        </Button>
      </Card>

      {me?.isAdmin && <AdminUsersCard myId={me.id} />}

      <Card className="space-y-3">
        <SectionHeader icon={User} title="Preferências" />
        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Nome</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Pronomes</label>
          <input
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            placeholder="ela/dela, ele/dele, elu/delu…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Início da transição</label>
          <input
            type="date"
            value={transitionStartDate}
            max={todayStr()}
            onChange={(e) => setTransitionStartDate(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <p className="mb-2 text-xs text-[var(--text-muted)]">Conteúdo de medidas</p>
          <div className="flex gap-2">
            {CONTENT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={profile?.contentPreference === opt.value ? 'primary' : 'secondary'}
                className="flex-1"
                onClick={() => updateProfile.mutate({ contentPreference: opt.value })}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-[var(--text)]">Mostrar dica do dia na Home</span>
          <Switch
            checked={profile?.showTipsOnHome ?? true}
            onChange={(v) => updateProfile.mutate({ showTipsOnHome: v })}
          />
        </div>


        <Button className="w-full" onClick={savePreferences} disabled={updateProfile.isPending}>
          Salvar
        </Button>
      </Card>

      <Card className="space-y-2">
        <SectionHeader icon={Lock} title="Privacidade do perfil" />
        <p className="text-xs text-[var(--text-muted)]">
          O que quiser compartilhar no seu perfil público, pra quem te segue.
        </p>
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-[var(--text)]">Humor médio</span>
          <Switch
            checked={profile?.shareAvgMood ?? false}
            onChange={(v) => updateProfile.mutate({ shareAvgMood: v })}
          />
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-[var(--text)]">Libido média</span>
          <Switch
            checked={profile?.shareLibido ?? false}
            onChange={(v) => updateProfile.mutate({ shareLibido: v })}
          />
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-[var(--text)]">O que toma (medicamentos ativos)</span>
          <Switch
            checked={profile?.shareMedications ?? false}
            onChange={(v) => updateProfile.mutate({ shareMedications: v })}
          />
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-[var(--text)]">Tempo de hormonioterapia</span>
          <Switch
            checked={profile?.shareHrtDuration ?? false}
            onChange={(v) => updateProfile.mutate({ shareHrtDuration: v })}
          />
        </div>
      </Card>

      <Card className="space-y-2">
        <SectionHeader icon={Shield} title="Segurança" />
        {faceIdSupported ? (
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm text-[var(--text)]">Face ID / Touch ID</p>
              <p className="text-xs text-[var(--text-muted)]">Pede biometria neste aparelho antes de abrir o app.</p>
            </div>
            <Switch checked={faceIdOn} onChange={handleToggleFaceId} disabled={faceIdBusy} />
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">Face ID/Touch ID não disponível neste navegador.</p>
        )}
      </Card>

      <Card className="space-y-2">
        <SectionHeader icon={Bell} title="Notificações" />
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm text-[var(--text)]">Lembretes de dose</p>
            <p className="text-xs text-[var(--text-muted)]">Status: {pushState || 'verificando…'}</p>
          </div>
          <Button variant="secondary" onClick={handleEnablePush}>
            Ativar
          </Button>
        </div>
      </Card>

      <Card className="space-y-2">
        <SectionHeader icon={Download} title="Dados" />
        <p className="text-xs text-[var(--text-muted)]">
          Exporta tudo (doses, humor, medidas, exames) em um arquivo JSON.
        </p>
        <Button variant="secondary" className="w-full" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exportando…' : 'Exportar meus dados'}
        </Button>
      </Card>

      <Card className="space-y-4">
        <SectionHeader icon={Palette} title="Customização do app" />

        <div>
          <p className="mb-2 text-xs text-[var(--text-muted)]">Modo</p>
          <div className="flex gap-2">
            <Button
              variant={theme.mode === 'light' ? 'primary' : 'secondary'}
              className="flex-1"
              onClick={() => {
                theme.setMode('light')
                applyTheme('light', theme.accent, theme.accent2)
              }}
            >
              Claro
            </Button>
            <Button
              variant={theme.mode === 'dark' ? 'primary' : 'secondary'}
              className="flex-1"
              onClick={() => {
                theme.setMode('dark')
                applyTheme('dark', theme.accent, theme.accent2)
              }}
            >
              Escuro
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-[var(--text-muted)]">Atalhos de cor</p>
          <div className="flex flex-wrap gap-2">
            {COLOR_SHORTCUTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  theme.setAccent(s.accent, s.accent2)
                  applyTheme(theme.mode, s.accent, s.accent2)
                }}
                className="h-9 w-9 rounded-full border-2 border-[var(--border)] transition hover:scale-110"
                style={{ background: `linear-gradient(135deg, ${s.accent}, ${s.accent2})` }}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-[var(--text-muted)]">Cores livres</p>
          <div className="flex gap-4">
            <label className="flex flex-1 flex-col items-center gap-1 text-xs text-[var(--text-muted)]">
              Principal
              <input
                type="color"
                value={theme.accent}
                onChange={(e) => {
                  theme.setAccent(e.target.value, theme.accent2)
                  applyTheme(theme.mode, e.target.value, theme.accent2)
                }}
                className="h-10 w-full cursor-pointer rounded-lg border border-[var(--border)] bg-transparent"
              />
            </label>
            <label className="flex flex-1 flex-col items-center gap-1 text-xs text-[var(--text-muted)]">
              Secundária
              <input
                type="color"
                value={theme.accent2}
                onChange={(e) => {
                  theme.setAccent(theme.accent, e.target.value)
                  applyTheme(theme.mode, theme.accent, e.target.value)
                }}
                className="h-10 w-full cursor-pointer rounded-lg border border-[var(--border)] bg-transparent"
              />
            </label>
          </div>
        </div>

      </Card>

      <Card className="space-y-2">
        <SectionHeader icon={Terminal} title="Modo dev" />
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => updateProfile.mutate({ onboardingCompleted: false })}
        >
          Repetir configuração inicial
        </Button>
      </Card>
    </div>
  )
}
