import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function LegalPage({ title, updatedAt, children }: { title: string; updatedAt: string; children: ReactNode }) {
  return (
    <div className="min-h-app bg-[var(--bg)] px-5 py-6 text-[var(--text)]">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <h1 className="mb-1 text-xl font-semibold">{title}</h1>
        <p className="mb-6 text-xs text-[var(--text-muted)]">Última atualização: {updatedAt}</p>
        <div className="legal-content space-y-4 text-sm leading-relaxed text-[var(--text)]">{children}</div>
      </div>
    </div>
  )
}
