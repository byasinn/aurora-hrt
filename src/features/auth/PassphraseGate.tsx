import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, api, getStoredPassphrase, setStoredPassphrase } from '../../lib/apiClient'
import type { Profile } from '../../../shared/types'

export default function PassphraseGate({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const check = useQuery({
    queryKey: ['auth-check', attempt],
    queryFn: () => api.get<Profile>('/profile'),
    retry: false,
    enabled: getStoredPassphrase() !== '' || attempt > 0,
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

  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--bg)] px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl"
      >
        <h1 className="mb-1 text-lg font-semibold text-[var(--text)]">Trans Track</h1>
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
          className="w-full rounded-lg bg-[var(--accent)] px-3 py-2 font-medium text-[#0b0f14] transition disabled:opacity-60"
        >
          {check.isFetching ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
