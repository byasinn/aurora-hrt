import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import AuroraLogo from '../../components/AuroraLogo'
import { Lock } from '../../components/icons'
import { useLogout } from '../../api/auth'
import { authenticateFaceId, disableFaceId, isFaceIdEnabled } from '../../lib/faceId'
import { PIN_LENGTH, clearPin, isPinEnabled, verifyPin } from '../../lib/appLock'
import { playSound } from '../../lib/sounds'

// Tela de bloqueio: Face ID e/ou PIN, conforme o que está ligado neste aparelho. Não tem "pular" —
// quem esqueceu sai da conta e entra de novo com email e senha (isso desliga o bloqueio).

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const logout = useLogout()
  const faceId = isFaceIdEnabled()
  const pinOn = isPinEnabled()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const triedFaceId = useRef(false)

  async function tryFaceId() {
    setChecking(true)
    setError(null)
    const ok = await authenticateFaceId()
    setChecking(false)
    if (ok) onUnlock()
    else setError('Não foi possível verificar.' + (pinOn ? ' Use seu PIN.' : ''))
  }

  // abre já pedindo a biometria, como os apps de banco
  useEffect(() => {
    if (faceId && !triedFaceId.current) {
      triedFaceId.current = true
      void tryFaceId()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function press(key: string) {
    if (checking) return
    if (key === '⌫') {
      setPin((p) => p.slice(0, -1))
      return
    }
    if (!key || pin.length >= PIN_LENGTH) return
    playSound('tap')
    const next = pin + key
    setPin(next)
    setError(null)
    if (next.length === PIN_LENGTH) {
      setChecking(true)
      const ok = await verifyPin(next)
      setChecking(false)
      if (ok) onUnlock()
      else {
        setError('PIN incorreto.')
        setPin('')
      }
    }
  }

  function forgot() {
    if (!confirm('Pra entrar sem o bloqueio, você vai sair da conta e entrar de novo com email e senha. Continuar?')) return
    clearPin()
    disableFaceId()
    logout.mutate(undefined, { onSettled: () => window.location.assign('/') })
  }

  return (
    <div className="flex min-h-app items-center justify-center px-6">
      <div className="w-full max-w-xs rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center [box-shadow:var(--shadow)]">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <Lock size={22} />
        </span>
        <h1 className="mb-1 flex justify-center">
          <AuroraLogo height={28} />
        </h1>
        <p className="mb-4 text-sm text-[var(--text-muted)]">{pinOn ? 'Digite seu PIN pra entrar.' : 'Desbloqueie com Face ID / Touch ID.'}</p>

        {pinOn && (
          <>
            <div className="mb-4 flex justify-center gap-3" aria-label={`${pin.length} de ${PIN_LENGTH} dígitos`}>
              {Array.from({ length: PIN_LENGTH }, (_, i) => (
                <span
                  key={i}
                  className={clsx('h-3.5 w-3.5 rounded-full border-2 border-[var(--accent)] transition', i < pin.length && 'bg-[var(--accent)]')}
                />
              ))}
            </div>
            <div className="mx-auto grid max-w-56 grid-cols-3 gap-2">
              {KEYS.map((key, i) =>
                key ? (
                  <button
                    key={i}
                    type="button"
                    onClick={() => press(key)}
                    aria-label={key === '⌫' ? 'Apagar' : key}
                    className="flex h-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-xl font-bold text-[var(--text)] transition active:scale-95"
                  >
                    {key}
                  </button>
                ) : (
                  <span key={i} />
                ),
              )}
            </div>
          </>
        )}

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {faceId && (
          <button
            onClick={tryFaceId}
            disabled={checking}
            className="mt-4 w-full rounded-2xl bg-[var(--accent)] px-3 py-2.5 font-bold text-[var(--accent-contrast)] transition disabled:opacity-60"
          >
            {checking ? 'Verificando…' : 'Usar Face ID / Touch ID'}
          </button>
        )}
        <button onClick={forgot} className="mt-3 text-sm text-[var(--text-muted)] underline">
          Esqueci — sair e entrar de novo
        </button>
      </div>
    </div>
  )
}
