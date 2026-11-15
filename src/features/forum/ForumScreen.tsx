import { useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Heart, MessageCircle, Plus, Search, X } from '../../components/icons'
import { Pin, Lock as LockIcon } from 'lucide-react'
import { Card, EmptyState, ScreenTitle } from '../../components/ui'
import Avatar from '../../components/Avatar'
import { useForumTopics } from '../../api/forum'
import { FORUM_TAGS, FORUM_TAG_BY_KEY, type ForumTopicSummary } from '../../../shared/forum'
import { timeAgo } from '../../lib/dateUtils'
import { playSound } from '../../lib/sounds'
import Guide from '../../components/Guide'

export function TagChip({ tag, active, onClick }: { tag: string; active?: boolean; onClick?: () => void }) {
  const label = FORUM_TAG_BY_KEY.get(tag)?.label ?? tag
  const cls = clsx(
    'rounded-full border px-2.5 py-1 text-xs font-bold transition',
    active ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]' : 'border-[var(--border)] text-[var(--text-muted)]',
  )
  return onClick ? (
    <button type="button" onClick={onClick} className={cls}>
      {label}
    </button>
  ) : (
    <span className={cls}>{label}</span>
  )
}

function TopicCard({ topic }: { topic: ForumTopicSummary }) {
  return (
    <Link to={`/comunidades/t/${topic.id}`} className="block" onClick={() => playSound('tap')}>
      <Card className={clsx('space-y-2 transition active:translate-y-0.5', topic.pinned && 'border-[var(--accent)]')}>
        <div className="flex items-start gap-2">
          {topic.pinned && <Pin size={15} className="mt-1 shrink-0 text-[var(--accent)]" />}
          {topic.locked && <LockIcon size={14} className="mt-1 shrink-0 text-[var(--text-muted)]" />}
          <p className="user-text min-w-0 flex-1 font-extrabold leading-snug">{topic.title}</p>
        </div>
        <p className="user-text line-clamp-2 text-sm text-[var(--text-muted)]">{topic.excerpt}</p>
        <div className="flex flex-wrap gap-1.5">
          {topic.tags.map((t) => (
            <TagChip key={t} tag={t} />
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Avatar src={topic.author?.avatarUrl} icon={topic.author?.avatarIcon} name={topic.author?.displayName ?? undefined} frame={topic.author?.frame} size={22} />
          <span className="min-w-0 flex-1 truncate">
            {topic.author ? topic.author.displayName || `@${topic.author.username}` : 'conta apagada'}
            {topic.author?.isAdmin && <b className="text-[var(--accent)]"> · equipe</b>} · {timeAgo(topic.lastActivityAt)}
          </span>
          <span className="flex items-center gap-1">
            <Heart size={13} /> {topic.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={13} /> {topic.replyCount}
          </span>
        </div>
      </Card>
    </Link>
  )
}

export default function ForumScreen() {
  const [sort, setSort] = useState<'recent' | 'relevant'>('recent')
  const [tag, setTag] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [showTags, setShowTags] = useState(false)
  const { data, isLoading, isError } = useForumTopics({ sort, tag, q: search })

  return (
    <div className="space-y-4">
      <Guide
        id="forum-1.3"
        steps={[
          { target: 'forum-new', title: 'Abra um tópico', text: 'Pergunte, conte uma conquista ou desabafe — com até 3 tags.' },
          { target: 'forum-sort', title: 'Recentes, relevantes e tags', text: 'Troque a ordem e filtre pelo assunto que te interessa.' },
        ]}
      />
      <div className="flex items-center justify-between gap-3">
        <ScreenTitle subtitle="Tópicos pra perguntar, contar, desabafar e trocar ideia.">Comunidade</ScreenTitle>
        <Link
          to="/comunidades/novo"
          data-guide="forum-new"
          aria-label="Novo tópico"
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 text-sm font-bold text-[var(--accent-contrast)]"
        >
          <Plus size={16} /> Tópico
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setSearch(query)
        }}
        className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3"
      >
        <Search size={16} className="text-[var(--text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar tópicos"
          className="min-h-11 flex-1 bg-transparent text-sm text-[var(--text)] outline-none"
        />
        {search && (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => {
              setQuery('')
              setSearch('')
            }}
          >
            <X size={16} className="text-[var(--text-muted)]" />
          </button>
        )}
      </form>

      <div className="flex items-center gap-2" data-guide="forum-sort">
        <div className="grid flex-1 grid-cols-2 gap-1 rounded-2xl bg-[var(--surface-2)] p-1">
          {(
            [
              ['recent', 'Mais recentes'],
              ['relevant', 'Mais relevantes'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={clsx(
                'min-h-9 rounded-xl text-sm font-bold',
                sort === key ? 'bg-[var(--surface)] text-[var(--text)] [box-shadow:var(--shadow)]' : 'text-[var(--text-muted)]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowTags((v) => !v)}
          className={clsx(
            'min-h-11 shrink-0 rounded-2xl border px-3 text-sm font-bold',
            tag || showTags ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)]',
          )}
        >
          Tags{tag ? ' (1)' : ''}
        </button>
      </div>

      {(showTags || tag) && (
        <div className="flex flex-wrap gap-1.5">
          {FORUM_TAGS.map((t) => (
            <TagChip key={t.key} tag={t.key} active={tag === t.key} onClick={() => setTag((cur) => (cur === t.key ? null : t.key))} />
          ))}
        </div>
      )}

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {isError && <EmptyState>Não deu pra carregar agora. Tenta de novo daqui a pouco.</EmptyState>}
      {data?.length === 0 && <EmptyState>{tag || search ? 'Nada com esse filtro ainda.' : 'Nenhum tópico ainda — abre o primeiro!'}</EmptyState>}
      <div className="space-y-3">
        {data?.map((t) => (
          <TopicCard key={t.id} topic={t} />
        ))}
      </div>
    </div>
  )
}
