import { useState, type FormEvent } from 'react'
import { LogOut, TriangleAlert } from 'lucide-react'
import { Trash2 } from '../../components/icons'
import { Button, Card } from '../../components/ui'
import { ApiError } from '../../lib/apiClient'
import { useMe, useLogout, useDeleteAccount, useChangeEmail, useChangePassword } from '../../api/auth'
import SettingsSubHeader from './SettingsSubHeader'

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-[var(--text)] outline-none focus:border-[var(--accent)]'

function EmailCard() {
  const { data: me } = useMe(true)
  const changeEmail = useChangeEmail()
  const [open, setOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await changeEmail.mutateAsync({ newEmail: newEmail.trim(), password: me?.hasPassword ? password : undefined })
      setMessage(res.message)
      setOpen(false)
      setPassword('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível pedir a troca.')
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-[var(--text-muted)]">Email</p>
          <p className="truncate text-sm font-medium text-[var(--text)]">{me?.email}</p>
        </div>
        {!open && (
          <Button variant="secondary" onClick={() => setOpen(true)} className="shrink-0">
            Trocar
          </Button>
        )}
      </div>
      {message && <p className="rounded-xl bg-[var(--accent-soft)] p-3 text-sm text-[var(--text)]">{message}</p>}
      {open && (
        <form onSubmit={submit} className="space-y-2">
          <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Novo email" className={inputClass} autoComplete="email" />
          {me?.hasPassword && (
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha atual" className={inputClass} autoComplete="current-password" />
          )}
          <p className="text-xs text-[var(--text-muted)]">Mandamos um link pro email novo. Ele só passa a valer depois que você abrir o link.</p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={changeEmail.isPending}>
              {changeEmail.isPending ? 'Enviando…' : 'Enviar link'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}

function PasswordCard() {
  const { data: me } = useMe(true)
  const changePassword = useChangePassword()
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirmNext, setConfirmNext] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const hasPassword = me?.hasPassword ?? true

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (next.length < 8) return setError('A senha nova precisa ter pelo menos 8 caracteres.')
    if (next !== confirmNext) return setError('As duas senhas novas não são iguais.')
    try {
      await changePassword.mutateAsync({ currentPassword: hasPassword ? current : undefined, newPassword: next })
      setDone(true)
      setOpen(false)
      setCurrent('')
      setNext('')
      setConfirmNext('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível trocar a senha.')
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-[var(--text-muted)]">Senha</p>
          <p className="text-sm font-medium text-[var(--text)]">{hasPassword ? '••••••••' : 'Você entra com o Google'}</p>
        </div>
        {!open && (
          <Button variant="secondary" onClick={() => setOpen(true)} className="shrink-0">
            {hasPassword ? 'Trocar' : 'Criar senha'}
          </Button>
        )}
      </div>
      {done && <p className="rounded-xl bg-[var(--accent-soft)] p-3 text-sm text-[var(--text)]">Senha salva. Os outros aparelhos foram desconectados.</p>}
      {open && (
        <form onSubmit={submit} className="space-y-2">
          {hasPassword && (
            <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Senha atual" className={inputClass} autoComplete="current-password" />
          )}
          <input type="password" required value={next} onChange={(e) => setNext(e.target.value)} placeholder="Senha nova (8+ caracteres)" className={inputClass} autoComplete="new-password" />
          <input type="password" required value={confirmNext} onChange={(e) => setConfirmNext(e.target.value)} placeholder="Repita a senha nova" className={inputClass} autoComplete="new-password" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Salvando…' : 'Salvar senha'}
            </Button>
          </div>
        </form>
      )}
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
  const logout = useLogout()

  return (
    <div className="space-y-4">
      <SettingsSubHeader title="Conta" />

      <EmailCard />
      <PasswordCard />


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
