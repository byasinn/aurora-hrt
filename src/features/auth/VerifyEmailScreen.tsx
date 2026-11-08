import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../lib/apiClient'
import AuroraLogo from '../../components/AuroraLogo'
import { useVerifyEmail } from '../../api/auth'

export default function VerifyEmailScreen() {
  const verify = useVerifyEmail()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) {
      setError('Link inválido.')
      return
    }
    verify.mutate(
      { token },
      {
        onSuccess: () => setDone(true),
        onError: (err) => setError(err instanceof ApiError ? err.message : 'Não foi possível confirmar o email.'),
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-app items-center justify-center px-6">
      <div className="w-full max-w-xs rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-xl">
        <h1 className="mb-3 flex justify-center">
          <AuroraLogo height={30} />
        </h1>
        {verify.isPending && <p className="text-sm text-[var(--text-muted)]">Confirmando seu email…</p>}
        {done && (
          <>
            <p className="mb-3 text-sm text-emerald-400">Email confirmado! Você já está logado.</p>
            <a href="/" className="text-sm text-[var(--accent)] underline">
              Ir para o app
            </a>
          </>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  )
}
