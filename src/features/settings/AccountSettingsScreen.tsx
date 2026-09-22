import { useEffect, useState } from 'react'
import { LogOut, Trash2, TriangleAlert, Check } from 'lucide-react'
import { Button, Card } from '../../components/ui'
import { ApiError } from '../../lib/apiClient'
import { useProfile, useUpdateProfile } from '../../api/profile'
import { useMe, useLogout, useDeleteAccount } from '../../api/auth'
import SettingsSubHeader from './SettingsSubHeader'

function UsernameCard() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) setUsername(profile.username ?? '')
  }, [profile])

  async function handleSave() {
    setError(null)
    setSaved(false)
    const normalized = username.trim().toLowerCase()
    if (normalized === profile?.username) return
    try {
      await updateProfile.mutateAsync({ username: normalized })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar.')
    }
  }

  return (
    <Card className="space-y-2">
      <label className="mb-1 block text-xs text-[var(--text-muted)]">Nome de usuário</label>
      <div className="flex gap-2">
        <div className="flex flex-1 items-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3">
          <span className="text-[var(--text-muted)]">@</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            maxLength={20}
            className="w-full bg-transparent px-1 py-2 text-[var(--text)] outline-none"
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={updateProfile.isPending || !username.trim() || username === profile?.username}
          className="shrink-0"
        >
          {saved ? <Check size={16} /> : 'Salvar'}
        </Button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-[11px] text-[var(--text-muted)]">
        3-20 caracteres, letras minúsculas, números e underscore. Até 3 trocas por mês.
      </p>
    </Card>
  )
}

function DeleteAccountCard() {
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const deleteAccount = useDeleteAccount()

  return (
    <Card className="space-y-3 border-red-500/30">
      <div className="flex items-center gap-2">
        <TriangleAlert size={16} className="text-red-500" />
        <h2 className="text-sm font-medium text-red-500">Zona de perigo</h2>
      </div>

      {!confirming ? (
        <Button
          variant="secondary"
          className="flex w-full items-center justify-center gap-2 !text-red-500"
          onClick={() => setConfirming(true)}
        >
          <Trash2 size={16} />
          Excluir minha conta
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-[var(--text-muted)]">
            Isso apaga sua conta e todos os dados (doses, humor, medidas, exames, posts, mensagens) pra sempre —
            não tem como desfazer. Digite <strong className="text-[var(--text)]">EXCLUIR</strong> pra confirmar.
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="EXCLUIR"
            className="w-full rounded-lg border border-red-500/40 bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-red-500"
          />
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button
              className="flex-1 !bg-red-500 !text-white"
              disabled={confirmText !== 'EXCLUIR' || deleteAccount.isPending}
              onClick={() => deleteAccount.mutate()}
            >
              {deleteAccount.isPending ? 'Excluindo…' : 'Excluir de vez'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export default function AccountSettingsScreen() {
  const { data: me } = useMe(true)
  const logout = useLogout()

  return (
    <div className="space-y-4">
      <SettingsSubHeader title="Conta" />

      <Card className="space-y-2">
        <label className="mb-1 block text-xs text-[var(--text-muted)]">Email</label>
        <p className="text-sm text-[var(--text)]">{me?.email}</p>
      </Card>

      <UsernameCard />

      <Card>
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

      <DeleteAccountCard />
    </div>
  )
}
