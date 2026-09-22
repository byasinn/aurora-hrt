import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useMe } from '../../api/auth'
import { isFaceIdEnabled, authenticateFaceId } from '../../lib/faceId'
import LoadingScreen from '../../components/LoadingScreen'
import LoginScreen from './LoginScreen'
import VerifyEmailScreen from './VerifyEmailScreen'
import ResetPasswordScreen from './ResetPasswordScreen'
import TermsScreen from '../legal/TermsScreen'
import PrivacyScreen from '../legal/PrivacyScreen'

const PUBLIC_PATHS = ['/verify-email', '/reset-password', '/termos', '/privacidade']

export default function AuthGate({ children }: { children: ReactNode }) {
  const location = useLocation()
  const isPublicRoute = PUBLIC_PATHS.includes(location.pathname)

  const me = useMe(!isPublicRoute)
  const [faceIdUnlocked, setFaceIdUnlocked] = useState(() => !isFaceIdEnabled())
  const [faceIdError, setFaceIdError] = useState<string | null>(null)
  const [faceIdChecking, setFaceIdChecking] = useState(false)

  if (location.pathname === '/verify-email') return <VerifyEmailScreen />
  if (location.pathname === '/reset-password') return <ResetPasswordScreen />
  if (location.pathname === '/termos') return <TermsScreen />
  if (location.pathname === '/privacidade') return <PrivacyScreen />

  if (me.isLoading) return <LoadingScreen />

  if (!me.isSuccess) {
    const authError = new URLSearchParams(window.location.search).get('authError')
    return <LoginScreen authError={authError} />
  }

  if (!faceIdUnlocked) {
    async function handleFaceId() {
      setFaceIdChecking(true)
      setFaceIdError(null)
      const ok = await authenticateFaceId()
      setFaceIdChecking(false)
      if (ok) setFaceIdUnlocked(true)
      else setFaceIdError('Não foi possível verificar. Tente de novo ou continue sem Face ID.')
    }

    return (
      <div className="flex min-h-app items-center justify-center px-6">
        <div className="w-full max-w-xs rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-xl">
          <p className="mb-3 text-4xl">🔒</p>
          <h1 className="font-logo mb-1 text-2xl uppercase tracking-wide text-[var(--text)]">Aurora</h1>
          <p className="mb-4 text-sm text-[var(--text-muted)]">Desbloqueie com Face ID / Touch ID.</p>
          {faceIdError && <p className="mb-3 text-sm text-red-400">{faceIdError}</p>}
          <button
            onClick={handleFaceId}
            disabled={faceIdChecking}
            className="mb-2 w-full rounded-lg bg-[var(--accent)] px-3 py-2 font-medium text-[var(--accent-contrast)] transition disabled:opacity-60"
          >
            {faceIdChecking ? 'Verificando…' : '🔓 Desbloquear'}
          </button>
          <button onClick={() => setFaceIdUnlocked(true)} className="text-xs text-[var(--text-muted)] underline">
            Continuar sem Face ID
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
