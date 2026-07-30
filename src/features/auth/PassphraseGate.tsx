import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, api, getStoredPassphrase, setStoredPassphrase } from '../../lib/apiClient'
import { isFaceIdEnabled, authenticateFaceId } from '../../lib/faceId'
import type { Profile } from '../../../shared/types'

export default function PassphraseGate({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [faceIdUnlocked, setFaceIdUnlocked] = useState(() => !isFaceIdEnabled())
  const [faceIdError, setFaceIdError] = useState<string | null>(null)
  const [faceIdChecking, setFaceIdChecking] = useState(false)

  const check = useQuery({
    queryKey: ['auth-check', attempt],
    queryFn: () => api.get<Profile>('/profile'),
    retry: false,
    enabled: faceIdUnlocked && (getStoredPassphrase() !== '' || attempt > 0),
  })

  useEffect(() => {
    if (!check.isError) return
    setError(
      check.error instanceof ApiError && check.error.status === 401
        ? 'Senha incorreta.'
        : 'Não foi possível conectar ao servidor.',
    )
  }, [check.isError, check.error])

  if (check.isSuccess) return <>{children}</>

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStoredPassphrase(input)
    setError(null)
    queryClient.removeQueries({ queryKey: ['auth-check'] })
    setAttempt((a) => a + 1)
  }

  async function handleFaceId() {
    setFaceIdChecking(true)
    setFaceIdError(null)
    const ok = await authenticateFaceId()
    setFaceIdChecking(false)
    if (ok) setFaceIdUnlocked(true)
    else setFaceIdError('Não foi possível verificar. Tente de novo ou use a senha.')
  }

  if (!faceIdUnlocked) {
    return (
      <div className="flex min-h-svh items-center justify-center px-6">
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
          <button
            onClick={() => setFaceIdUnlocked(true)}
            className="text-xs text-[var(--text-muted)] underline"
          >
            Usar senha em vez disso
          </button>
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
        <p className="mb-4 text-sm text-[var(--text-muted)]">Digite a senha para continuar.</p>
        <input
          type="password"
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Senha"
          className="mb-3 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={check.isFetching}
          className="w-full rounded-lg bg-[var(--accent)] px-3 py-2 font-medium text-[var(--accent-contrast)] transition disabled:opacity-60"
        >
          {check.isFetching ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
