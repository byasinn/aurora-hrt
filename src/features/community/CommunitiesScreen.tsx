import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, TrendingUp, Users, X } from 'lucide-react'
import { getCollectibleIcon } from '../../lib/collectibleIcons'
import { Button, Card, EmptyState, ScreenTitle } from '../../components/ui'
import { useCommunities, useCreateCommunity } from '../../api/community'
import { useMe } from '../../api/auth'
import type { CommunitySummary } from '../../../shared/types'

function CommunityCard({ community }: { community: CommunitySummary }) {
  const Icon = getCollectibleIcon(community.icon) ?? Users
  return (
    <Link
      to={`/comunidade/${community.id}`}
      className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 [box-shadow:var(--shadow)]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--text)]">{community.name}</p>
        <p className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <Users size={11} />
          {community.memberCount} membro{community.memberCount === 1 ? '' : 's'}
          {community.isMember && ' · você participa'}
        </p>
      </div>
    </Link>
  )
}

function CreateCommunityForm({ onDone }: { onDone: () => void }) {
  const createCommunity = useCreateCommunity()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')

  async function handleCreate() {
    if (!name.trim()) return
    await createCommunity.mutateAsync({
      name: name.trim(),
      description: description.trim() || null,
      icon: 'heart',
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    })
    onDone()
  }

  return (
    <Card className="space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome da comunidade"
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descrição (opcional)"
        rows={2}
        className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
      />
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags separadas por vírgula (opcional)"
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
      />
      <Button onClick={handleCreate} disabled={createCommunity.isPending || !name.trim()} className="w-full">
        Criar comunidade
      </Button>
    </Card>
  )
}

export default function CommunitiesScreen() {
  const [query, setQuery] = useState('')
  const { data: communities, isLoading } = useCommunities(query)
  const { data: me } = useMe(true)
  const [createOpen, setCreateOpen] = useState(false)

  const popular = [...(communities ?? [])].sort((a, b) => b.memberCount - a.memberCount)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ScreenTitle>Comunidades</ScreenTitle>
        {me?.isAdmin && (
          <button
            onClick={() => setCreateOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]"
          >
            {createOpen ? <X size={18} /> : <Plus size={18} />}
          </button>
        )}
      </div>

      {createOpen && <CreateCommunityForm onDone={() => setCreateOpen(false)} />}

      <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5">
        <Search size={16} className="text-[var(--text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar comunidades…"
          className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none"
        />
      </div>

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {communities && communities.length === 0 && <EmptyState>Nenhuma comunidade encontrada.</EmptyState>}

      {popular.length > 0 && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
            {query.trim() ? <Search size={12} /> : <TrendingUp size={12} />}
            {query.trim() ? 'Resultados' : 'Populares'}
          </h2>
          <div className="space-y-2">
            {popular.map((c) => (
              <CommunityCard key={c.id} community={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
