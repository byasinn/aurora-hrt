import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { Button, Card, EmptyState, ScreenTitle } from '../../components/ui'
import { useProfile, useUpdateProfile } from '../../api/profile'
import type { ExternalLink } from '../../../shared/types'

export default function ExternalLinksScreen() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()

  const [links, setLinks] = useState<ExternalLink[]>([])
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (profile) setLinks((profile.externalLinks as ExternalLink[] | null) ?? [])
  }, [profile])

  function addLink() {
    if (!label.trim() || !url.trim()) return
    let normalizedUrl = url.trim()
    if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = `https://${normalizedUrl}`
    const next = [...links, { label: label.trim(), url: normalizedUrl }]
    setLinks(next)
    updateProfile.mutate({ externalLinks: next })
    setLabel('')
    setUrl('')
  }

  function removeLink(index: number) {
    const next = links.filter((_, i) => i !== index)
    setLinks(next)
    updateProfile.mutate({ externalLinks: next })
  }

  return (
    <div className="space-y-4">
      <Link to="/perfil/mais-informacoes" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ChevronLeft size={16} /> Mais informações
      </Link>
      <ScreenTitle>Sites e redes sociais</ScreenTitle>

      {links.length === 0 ? (
        <EmptyState>Nenhum link adicionado ainda.</EmptyState>
      ) : (
        <Card className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text)]">{link.label}</p>
                <p className="truncate text-xs text-[var(--text-muted)]">{link.url}</p>
              </div>
              <button onClick={() => removeLink(i)} className="shrink-0 text-[var(--text-muted)]">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </Card>
      )}

      <Card className="space-y-3">
        <p className="text-xs text-[var(--text-muted)]">Adicionar link (até 5)</p>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nome (ex: Instagram)"
          maxLength={40}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Link (ex: instagram.com/seu_perfil)"
          maxLength={300}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <Button
          className="flex w-full items-center justify-center gap-1"
          onClick={addLink}
          disabled={!label.trim() || !url.trim() || links.length >= 5}
        >
          <Plus size={16} /> Adicionar
        </Button>
      </Card>
    </div>
  )
}
