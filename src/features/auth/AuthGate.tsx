import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useMe } from '../../api/auth'
import { isFaceIdEnabled } from '../../lib/faceId'
import { isPinEnabled } from '../../lib/appLock'
import LockScreen from './LockScreen'
import ConfirmEmailChangeScreen from './ConfirmEmailChangeScreen'
import LoadingScreen from '../../components/LoadingScreen'
import LoginScreen from './LoginScreen'
import VerifyEmailScreen from './VerifyEmailScreen'
import ResetPasswordScreen from './ResetPasswordScreen'
import TermsScreen from '../legal/TermsScreen'
import PrivacyScreen from '../legal/PrivacyScreen'

const PUBLIC_PATHS = ['/verify-email', '/reset-password', '/confirmar-email', '/termos', '/privacidade']

export default function AuthGate({ children }: { children: ReactNode }) {
  const location = useLocation()
  const isPublicRoute = PUBLIC_PATHS.includes(location.pathname)

  const me = useMe(!isPublicRoute)
  // bloqueio deste aparelho (Face ID e/ou PIN, em Privacidade e segurança)
  const [unlocked, setUnlocked] = useState(() => !isFaceIdEnabled() && !isPinEnabled())

  if (location.pathname === '/verify-email') return <VerifyEmailScreen />
  if (location.pathname === '/reset-password') return <ResetPasswordScreen />
  if (location.pathname === '/confirmar-email') return <ConfirmEmailChangeScreen />
  if (location.pathname === '/termos') return <TermsScreen />
  if (location.pathname === '/privacidade') return <PrivacyScreen />

  if (me.isLoading) return <LoadingScreen />

  if (!me.isSuccess) {
    const authError = new URLSearchParams(window.location.search).get('authError')
    return <LoginScreen authError={authError} />
  }

  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />

  return <>{children}</>
}
