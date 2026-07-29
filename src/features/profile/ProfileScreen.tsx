import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, ScreenTitle } from '../../components/ui'
import Avatar from '../../components/Avatar'
import { useProfile, useUpdateProfile } from '../../api/profile'
import { useThemeStore, applyTheme, COLOR_SHORTCUTS } from '../../lib/themeStore'
import { todayStr } from '../../lib/dateUtils'
import { enablePushNotifications, getNotificationPermissionState } from '../../lib/notifications'
import { fileToResizedDataUrl } from '../../lib/image'
import { downloadBackup } from '../../lib/exportData'
import {
  isFaceIdSupported,
  isFaceIdEnabled,
  registerFaceId,
  disableFaceId,
} from '../../lib/faceId'

const CONTENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'feminine', label: 'Feminino' },
  { value: 'masculine', label: 'Masculino' },
  { value: 'combined', label: 'Combinado' },
]

const MODULE_OPTIONS: { value: string; label: string }[] = [
  { value: 'medications', label: '💊 Remédios' },
  { value: 'mood', label: '💜 Humor' },
  { value: 'calendar', label: '🗓️ Histórico' },
  { value: 'measurements', label: '📏 Medidas' },
]

export default function ProfileScreen() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const theme = useThemeStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [transitionStartDate, setTransitionStartDate] = useState('')
  const [pushState, setPushState] = useState<string>('')
  const [uploading, setUploading] = useState(false)
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

  function saveProfile() {
    updateProfile.mutate({ displayName, pronouns, transitionStartDate: transitionStartDate || null })
  }

  async function handleEnablePush() {
    const res = await enablePushNotifications()
    setPushState(res.ok ? 'granted' : (res.reason ?? 'erro'))
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await fileToResizedDataUrl(file)
      await updateProfile.mutateAsync({ avatarUrl: dataUrl })
    } finally {
      setUploading(false)
    }
  }

  async function handleToggleFaceId() {
    setFaceIdBusy(true)
    try {
      if (faceIdOn) {
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
      <ScreenTitle>Perfil</ScreenTitle>

      <Card className="flex flex-col items-center gap-3 text-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative"
          disabled={uploading}
        >
          <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} size={88} />
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--accent)] text-xs text-[var(--accent-contrast)]">
            {uploading ? '…' : '✏️'}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <div>
          <p className="font-semibold text-[var(--text)]">{profile?.displayName || 'Sem nome ainda'}</p>
          <p className="text-xs text-[var(--text-muted)]">{profile?.pronouns || 'Adicione seus pronomes'}</p>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Link to="/achievements">
          <Card className="flex flex-col items-center gap-1 py-4 text-center">
            <span className="text-2xl">🏆</span>
            <span className="text-xs font-medium text-[var(--text)]">Troféus</span>
          </Card>
        </Link>
        <Link to="/measurements">
          <Card className="flex flex-col items-center gap-1 py-4 text-center">
            <span className="text-2xl">📏</span>
            <span className="text-xs font-medium text-[var(--text)]">Medidas</span>
          </Card>
        </Link>
        <Link to="/labs">
          <Card className="flex flex-col items-center gap-1 py-4 text-center">
            <span className="text-2xl">🧪</span>
            <span className="text-xs font-medium text-[var(--text)]">Exames</span>
          </Card>
        </Link>
      </div>

      <Card className="space-y-3">
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
        <Button className="w-full" onClick={saveProfile} disabled={updateProfile.isPending}>
          Salvar perfil
        </Button>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Notificações</h2>
        <p className="text-xs text-[var(--text-muted)]">Status: {pushState || 'verificando…'}</p>
        <Button variant="secondary" className="w-full" onClick={handleEnablePush}>
          Ativar lembretes por notificação
        </Button>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Segurança e backup</h2>

        {faceIdSupported && (
          <>
            <p className="text-xs text-[var(--text-muted)]">
              Pede Face ID/Touch ID neste aparelho antes de abrir o app (a senha continua sendo a
              autenticação real do servidor).
            </p>
            <Button variant="secondary" className="w-full" onClick={handleToggleFaceId} disabled={faceIdBusy}>
              {faceIdOn ? '🔓 Desativar Face ID / Touch ID' : '🔐 Ativar Face ID / Touch ID'}
            </Button>
          </>
        )}

        <p className="text-xs text-[var(--text-muted)]">
          Exporta tudo (doses, humor, medidas, exames) em um arquivo JSON, pra nunca perder nada.
        </p>
        <Button variant="secondary" className="w-full" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exportando…' : '⬇️ Exportar meus dados'}
        </Button>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Conteúdo de medidas</h2>
        <p className="text-xs text-[var(--text-muted)]">
          Define quais medidas e tutoriais aparecem na aba Medidas.
        </p>
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
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Aparência</h2>

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
              ☀️ Claro
            </Button>
            <Button
              variant={theme.mode === 'dark' ? 'primary' : 'secondary'}
              className="flex-1"
              onClick={() => {
                theme.setMode('dark')
                applyTheme('dark', theme.accent, theme.accent2)
              }}
            >
              🌙 Escuro
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
          <p className="mb-2 text-xs text-[var(--text-muted)]">
            Cores livres — escolha qualquer combinação, do seu jeito
          </p>
          <div className="flex gap-4">
            <label className="flex flex-1 flex-col items-center gap-1 text-xs text-[var(--text-muted)]">
              Cor principal
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
              Cor secundária
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

      <Card className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Módulos visíveis no menu</h2>
        <div className="flex flex-col gap-2">
          {MODULE_OPTIONS.map((opt) => {
            const enabled = (profile?.enabledModules as string[] | undefined)?.includes(opt.value) ?? true
            return (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5"
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => {
                    const current = (profile?.enabledModules as string[] | undefined) ?? []
                    const updated = enabled
                      ? current.filter((m) => m !== opt.value)
                      : [...current, opt.value]
                    updateProfile.mutate({ enabledModules: updated })
                  }}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                <span className="text-sm text-[var(--text)]">{opt.label}</span>
              </label>
            )
          })}
        </div>
      </Card>

      <button
        type="button"
        onClick={() => updateProfile.mutate({ onboardingCompleted: false })}
        className="pb-2 text-center text-xs text-[var(--text-muted)]/60"
      >
        repetir configuração inicial (dev)
      </button>
    </div>
  )
}
