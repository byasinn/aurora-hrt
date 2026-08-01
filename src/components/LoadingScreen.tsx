import { useEffect, useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

const MESSAGES = [
  'Ainda em versão beta — obrigada pela paciência.',
  'Carregando sua jornada…',
  'Preparando seus troféus (alguns bem safados, se o modo NSFW estiver ligado).',
  'Ajustando os detalhes…',
]

export default function LoadingScreen() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), 2400)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="font-logo flag-gradient-text flex items-center gap-2 text-3xl uppercase tracking-wide">
        <Sparkles size={26} className="text-[var(--accent)]" />
        Aurora
      </span>
      <Loader2 size={28} className="animate-spin text-[var(--accent)]" />
      <p className="max-w-xs text-sm text-[var(--text-muted)]">{MESSAGES[index]}</p>
    </div>
  )
}
