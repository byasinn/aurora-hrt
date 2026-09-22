import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../lib/apiClient'
import { useLogin, useRequestPasswordReset, useResendVerification, useSignup } from '../../api/auth'

type Mode = 'login' | 'signup' | 'forgot'

export default function LoginScreen({ authError }: { authError?: string | null }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [showResend, setShowResend] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [ageConfirmed, setAgeConfirmed] = useState(false)

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
        setError(t('auth.connectionError'))
      }
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault()
    resetMessages()
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }
    if (!termsAccepted) {
      setError(t('auth.mustAcceptTerms'))
      return
    }
    if (!ageConfirmed) {
      setError(t('auth.mustConfirmAge'))
      return
    }
    try {
      const res = await signup.mutateAsync({ email, password, termsAccepted, ageConfirmed })
      setNotice(res.message)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.connectionError'))
    }
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault()
    resetMessages()
    try {
      const res = await requestReset.mutateAsync({ email })
      setNotice(res.message)
    } catch {
      setNotice(t('auth.forgotFallback'))
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
    banned: t('auth.errors.banned'),
    invalid_state: t('auth.errors.invalid_state'),
    google_not_configured: t('auth.errors.google_not_configured'),
    google_token_exchange_failed: t('auth.errors.google_token_exchange_failed'),
    google_profile_failed: t('auth.errors.google_profile_failed'),
    google_email_not_verified: t('auth.errors.google_email_not_verified'),
    unknown_error: t('auth.errors.unknown_error'),
  }

  return (
    <div className="flex min-h-app items-center justify-center px-6">
      <div className="w-full max-w-xs rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        <h1 className="font-logo mb-1 text-2xl uppercase tracking-wide text-[var(--text)]">{t('common.appName')}</h1>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          {mode === 'login' && t('auth.loginSubtitle')}
          {mode === 'signup' && t('auth.signupSubtitle')}
          {mode === 'forgot' && t('auth.forgotSubtitle')}
        </p>

        {authError && (
          <p className="mb-3 text-sm text-red-400">{AUTH_ERROR_MESSAGES[authError] ?? t('auth.errors.generic')}</p>
        )}

        {mode !== 'forgot' && (
          <a
            href="/api/auth-google-start"
            className="mb-1.5 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-medium text-[var(--text)]"
          >
            {t('auth.continueWithGoogle')}
          </a>
        )}

        {mode === 'signup' && (
          <p className="mb-3 text-[11px] text-[var(--text-muted)]">
            {t('auth.googleTermsPrefix')}{' '}
            <a href="/termos" target="_blank" rel="noreferrer" className="text-[var(--accent)] underline">
              {t('auth.termsLink')}
            </a>{' '}
            {t('auth.termsAnd')}{' '}
            <a href="/privacidade" target="_blank" rel="noreferrer" className="text-[var(--accent)] underline">
              {t('auth.privacyLink')}
            </a>
            .
          </p>
        )}

        {mode !== 'forgot' && (
          <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <div className="h-px flex-1 bg-[var(--border)]" />
            {t('auth.or')}
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
            placeholder={t('auth.emailPlaceholder')}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />

          {mode !== 'forgot' && (
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
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
              placeholder={t('auth.confirmPasswordPlaceholder')}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          )}

          {mode === 'signup' && (
            <label className="flex items-start gap-2 text-[11px] text-[var(--text-muted)]">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 shrink-0"
              />
              <span>{t('auth.ageConfirm')}</span>
            </label>
          )}

          {mode === 'signup' && (
            <label className="flex items-start gap-2 text-[11px] text-[var(--text-muted)]">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 shrink-0"
              />
              <span>
                {t('auth.termsPrefix')}{' '}
                <a href="/termos" target="_blank" rel="noreferrer" className="text-[var(--accent)] underline">
                  {t('auth.termsLink')}
                </a>{' '}
                {t('auth.termsAnd')}{' '}
                <a href="/privacidade" target="_blank" rel="noreferrer" className="text-[var(--accent)] underline">
                  {t('auth.privacyLink')}
                </a>
                .
              </span>
            </label>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
          {notice && <p className="text-sm text-emerald-400">{notice}</p>}
          {showResend && (
            <button type="button" onClick={handleResend} className="text-xs text-[var(--accent)] underline">
              {t('auth.resendVerification')}
            </button>
          )}

          <button
            type="submit"
            disabled={login.isPending || signup.isPending || requestReset.isPending || (mode === 'signup' && !termsAccepted)}
            className="w-full rounded-lg bg-[var(--accent)] px-3 py-2 font-medium text-[var(--accent-contrast)] transition disabled:opacity-60"
          >
            {mode === 'login' && (login.isPending ? t('auth.loggingIn') : t('auth.loginButton'))}
            {mode === 'signup' && (signup.isPending ? t('auth.signingUp') : t('auth.signupButton'))}
            {mode === 'forgot' && (requestReset.isPending ? t('auth.sendingReset') : t('auth.forgotButton'))}
          </button>
        </form>

        <div className="mt-4 flex justify-between text-xs text-[var(--text-muted)]">
          {mode === 'login' && (
            <>
              <button onClick={() => { setMode('signup'); resetMessages() }} className="underline">
                {t('auth.createAccount')}
              </button>
              <button onClick={() => { setMode('forgot'); resetMessages() }} className="underline">
                {t('auth.forgotPassword')}
              </button>
            </>
          )}
          {mode !== 'login' && (
            <button onClick={() => { setMode('login'); resetMessages() }} className="underline">
              {t('auth.backToLogin')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
