import { useState, type FormEvent } from 'react'
import { ApiError } from '../../lib/apiClient'
import { useResetPassword } from '../../api/auth'

export default function ResetPasswordScreen() {
  const resetPassword = useResetPassword()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) {
      setError('Link inválido.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    try {
      await resetPassword.mutateAsync({ token, newPassword: password })
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível trocar a senha.')
    }
  }

  if (done) {
    return (
      <div className="flex min-h-svh items-center justify-center px-6">
        <div className="w-full max-w-xs rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-xl">
          <h1 className="font-logo mb-3 text-2xl uppercase tracking-wide text-[var(--text)]">Aurora</h1>
          <p className="mb-3 text-sm text-emerald-400">Senha alterada! Você já está logado.</p>
          <a href="/" className="text-sm text-[var(--accent)] underline">
            Ir para o app
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl"
      >
        <h1 className="font-logo mb-1 text-2xl uppercase tracking-wide text-[var(--text)]">Aurora</h1>
        <p className="mb-4 text-sm text-[var(--text-muted)]">Escolha uma nova senha.</p>
        <input
          type="password"
          required
          minLength={8}
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nova senha"
          className="mb-3 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <input
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirme a nova senha"
          className="mb-3 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={resetPassword.isPending}
          className="w-full rounded-lg bg-[var(--accent)] px-3 py-2 font-medium text-[var(--accent-contrast)] transition disabled:opacity-60"
        >
          {resetPassword.isPending ? 'Salvando…' : 'Trocar senha'}
        </button>
      </form>
    </div>
  )
}
