import { useState, type FormEvent } from 'react'
import { ApiError } from '../../lib/apiClient'
import { useLogin, useRequestPasswordReset, useResendVerification, useSignup } from '../../api/auth'

type Mode = 'login' | 'signup' | 'forgot'

export default function LoginScreen({ authError }: { authError?: string | null }) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [showResend, setShowResend] = useState(false)

  const login = useLogin()
  const signup = useSignup()
  const requestReset = useRequestPasswordReset()
  const resendVerification = useResendVerification()

  function resetMessages() {
    setError(null)
    setNotice(null)
    setShowResend(false)
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    resetMessages()
    try {
      await login.mutateAsync({ email, password })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        if (err.code === 'EMAIL_NOT_VERIFIED') setShowResend(true)
      } else {
        setError('Não foi possível conectar ao servidor.')
      }
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault()
    resetMessages()
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    try {
      const res = await signup.mutateAsync({ email, password })
      setNotice(res.message)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível conectar ao servidor.')
    }
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault()
    resetMessages()
    try {
      const res = await requestReset.mutateAsync({ email })
      setNotice(res.message)
    } catch {
      setNotice('Se esse email tiver uma conta, enviamos um link de recuperação.')
    }
  }

  async function handleResend() {
    try {
      const res = await resendVerification.mutateAsync({ email })
      setNotice(res.message)
      setShowResend(false)
    } catch {
      // já é uma resposta genérica, sem tratamento especial de erro
    }
  }

  const AUTH_ERROR_MESSAGES: Record<string, string> = {
    banned: 'Essa conta foi banida.',
    invalid_state: 'Sessão de login expirou, tenta de novo.',
    google_not_configured: 'Login com Google ainda não está configurado.',
    google_token_exchange_failed: 'Não foi possível confirmar o login com Google.',
    google_profile_failed: 'Não foi possível confirmar o login com Google.',
    google_email_not_verified: 'Seu email do Google precisa estar verificado.',
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-6">
      <div className="w-full max-w-xs rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        <h1 className="font-logo mb-1 text-2xl uppercase tracking-wide text-[var(--text)]">Aurora</h1>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          {mode === 'login' && 'Entre para continuar.'}
          {mode === 'signup' && 'Crie sua conta.'}
          {mode === 'forgot' && 'Recupere o acesso à sua conta.'}
        </p>

        {authError && (
          <p className="mb-3 text-sm text-red-400">{AUTH_ERROR_MESSAGES[authError] ?? 'Não foi possível entrar com Google.'}</p>
        )}

        {mode !== 'forgot' && (
          <a
            href="/api/auth-google-start"
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-medium text-[var(--text)]"
          >
            Continuar com Google
          </a>
        )}

        {mode !== 'forgot' && (
          <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <div className="h-px flex-1 bg-[var(--border)]" />
            ou
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleForgot} className="space-y-3">
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />

          {mode !== 'forgot' && (
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          )}

          {mode === 'signup' && (
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme a senha"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
          {notice && <p className="text-sm text-emerald-400">{notice}</p>}
          {showResend && (
            <button type="button" onClick={handleResend} className="text-xs text-[var(--accent)] underline">
              Reenviar email de confirmação
            </button>
          )}

          <button
            type="submit"
            disabled={login.isPending || signup.isPending || requestReset.isPending}
            className="w-full rounded-lg bg-[var(--accent)] px-3 py-2 font-medium text-[var(--accent-contrast)] transition disabled:opacity-60"
          >
            {mode === 'login' && (login.isPending ? 'Entrando…' : 'Entrar')}
            {mode === 'signup' && (signup.isPending ? 'Criando conta…' : 'Criar conta')}
            {mode === 'forgot' && (requestReset.isPending ? 'Enviando…' : 'Enviar link de recuperação')}
          </button>
        </form>

        <div className="mt-4 flex justify-between text-xs text-[var(--text-muted)]">
          {mode === 'login' && (
            <>
              <button onClick={() => { setMode('signup'); resetMessages() }} className="underline">
                Criar conta
              </button>
              <button onClick={() => { setMode('forgot'); resetMessages() }} className="underline">
                Esqueci minha senha
              </button>
            </>
          )}
          {mode !== 'login' && (
            <button onClick={() => { setMode('login'); resetMessages() }} className="underline">
              ← Voltar para o login
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
