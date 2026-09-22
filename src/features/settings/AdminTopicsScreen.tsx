import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Compass, Plus, Trash2 } from 'lucide-react'
import { Card, Button } from '../../components/ui'
import { toastError } from '../../lib/toast'
import {
  useTopicPages,
  useCreateTopicPage,
  useContentSources,
  useCreateContentSource,
  useSetContentSourceActive,
  useDeleteContentSource,
} from '../../api/topics'

export default function AdminTopicsScreen() {
  const { data: topics } = useTopicPages()
  const createTopic = useCreateTopicPage()
  const { data: sources } = useContentSources()
  const createSource = useCreateContentSource()
  const setSourceActive = useSetContentSourceActive()
  const deleteSource = useDeleteContentSource()

  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const [sourceTopicId, setSourceTopicId] = useState<number | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [feedUrl, setFeedUrl] = useState('')

  async function handleCreateTopic() {
    if (!slug.trim() || !name.trim()) return
    try {
      await createTopic.mutateAsync({ slug: slug.trim(), name: name.trim(), description: description.trim() || null, icon: 'sparkles', color: '#7fd4e8' })
      setSlug('')
      setName('')
      setDescription('')
    } catch (err) {
      toastError(err, 'Não foi possível criar a página de tópico.')
    }
  }

  async function handleCreateSource() {
    if (!sourceTopicId || !sourceName.trim() || !feedUrl.trim()) return
    try {
      await createSource.mutateAsync({ topicPageId: sourceTopicId, name: sourceName.trim(), feedUrl: feedUrl.trim() })
      setSourceName('')
      setFeedUrl('')
    } catch (err) {
      toastError(err, 'Não foi possível adicionar a fonte.')
    }
  }

  const topicNameById = new Map((topics ?? []).map((t) => [t.id, t.name]))

  return (
    <div className="space-y-4">
      <Link to="/settings/admin" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ChevronLeft size={16} /> Administração
      </Link>
      <div className="flex items-center gap-2">
        <Compass size={20} className="text-[var(--accent)]" />
        <h1 className="text-xl font-semibold text-[var(--text)]">Tópicos e fontes</h1>
      </div>

      <Card className="space-y-3">
        <p className="text-sm font-medium text-[var(--text)]">Nova página de tópico</p>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
          placeholder="slug (ex: trans-fem)"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome (ex: Trans Fem)"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição curta (opcional)"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <Button className="w-full" onClick={handleCreateTopic} disabled={createTopic.isPending || !slug.trim() || !name.trim()}>
          <Plus size={14} className="mr-1 inline" /> Criar página
        </Button>
      </Card>

      <Card className="space-y-2">
        <p className="text-sm font-medium text-[var(--text)]">Páginas existentes</p>
        {(topics ?? []).map((t) => (
          <p key={t.id} className="text-xs text-[var(--text-muted)]">
            {t.name} · <span className="text-[var(--text)]">{t.postCount} posts</span> · {t.isFollowedByMe ? 'você segue' : ''}
          </p>
        ))}
        {(!topics || topics.length === 0) && <p className="text-xs text-[var(--text-muted)]">Nenhuma ainda.</p>}
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-medium text-[var(--text)]">Nova fonte RSS/Atom (YouTube funciona via feed do canal)</p>
        <select
          value={sourceTopicId ?? ''}
          onChange={(e) => setSourceTopicId(e.target.value ? Number(e.target.value) : null)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        >
          <option value="">Escolha a página de tópico</option>
          {(topics ?? []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
          placeholder="Nome da fonte (ex: G1 Diversidade)"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <input
          value={feedUrl}
          onChange={(e) => setFeedUrl(e.target.value)}
          placeholder="URL do feed RSS/Atom"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <Button
          className="w-full"
          onClick={handleCreateSource}
          disabled={createSource.isPending || !sourceTopicId || !sourceName.trim() || !feedUrl.trim()}
        >
          <Plus size={14} className="mr-1 inline" /> Adicionar fonte
        </Button>
      </Card>

      <Card className="space-y-2">
        <p className="text-sm font-medium text-[var(--text)]">Fontes cadastradas</p>
        {(sources ?? []).map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-2 border-b border-[var(--border)] py-2 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[var(--text)]">
                {s.name} <span className="text-[var(--text-muted)]">— {topicNameById.get(s.topicPageId) ?? '?'}</span>
              </p>
              <p className="truncate text-[10px] text-[var(--text-muted)]">
                {s.lastFetchedAt ? `última busca: ${new Date(s.lastFetchedAt).toLocaleString('pt-BR')}` : 'ainda não buscada'}
                {s.lastError && <span className="text-red-500"> · erro: {s.lastError.slice(0, 60)}</span>}
              </p>
            </div>
            <button
              onClick={() => setSourceActive.mutate({ id: s.id, active: !s.active })}
              className={
                'shrink-0 rounded-full border px-2 py-1 text-[10px] ' +
                (s.active ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)]')
              }
            >
              {s.active ? 'ativa' : 'pausada'}
            </button>
            <button
              onClick={() => {
                if (confirm(`Remover a fonte "${s.name}"?`)) deleteSource.mutate(s.id)
              }}
              className="shrink-0 text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {(!sources || sources.length === 0) && <p className="text-xs text-[var(--text-muted)]">Nenhuma ainda.</p>}
      </Card>
    </div>
  )
}
