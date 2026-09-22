import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Sparkles } from 'lucide-react'
import { Card, EmptyState } from '../../components/ui'
import { getCollectibleIcon } from '../../lib/collectibleIcons'
import { timeAgo } from '../../lib/dateUtils'
import { useTopicPages, useTopicPosts, useFollowTopic, useUnfollowTopic } from '../../api/topics'

export default function TopicPageScreen() {
  const { slug } = useParams<{ slug: string }>()
  const { data: topics, isLoading: topicsLoading } = useTopicPages()
  const topic = topics?.find((t) => t.slug === slug)
  const { data: posts, isLoading: postsLoading } = useTopicPosts(topic?.id ?? null)
  const follow = useFollowTopic()
  const unfollow = useUnfollowTopic()

  if (topicsLoading) return <p className="text-sm text-[var(--text-muted)]">Carregando…</p>
  if (!topic) return <EmptyState>Tópico não encontrado.</EmptyState>

  const Icon = getCollectibleIcon(topic.icon) ?? Sparkles

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/feed" className="flex h-8 w-8 items-center justify-center text-[var(--text-muted)]">
          <ArrowLeft size={18} />
        </Link>
      </div>

      <Card className="flex items-center gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: topic.color }}
        >
          <Icon size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--text)]">{topic.name}</p>
          {topic.description && <p className="text-xs text-[var(--text-muted)]">{topic.description}</p>}
        </div>
        <button
          onClick={() => (topic.isFollowedByMe ? unfollow.mutate(topic.id) : follow.mutate(topic.id))}
          disabled={follow.isPending || unfollow.isPending}
          className="shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-50"
          style={
            topic.isFollowedByMe
              ? { border: '1px solid var(--border)', color: 'var(--text)' }
              : { background: topic.color, color: 'white' }
          }
        >
          {topic.isFollowedByMe ? 'Seguindo' : 'Seguir'}
        </button>
      </Card>

      {postsLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {posts && posts.length === 0 && (
        <EmptyState>Nada por aqui ainda — as fontes desse tópico ainda não trouxeram nada.</EmptyState>
      )}

      <div className="space-y-2">
        {posts?.map((p) => (
          <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
            <Card className="flex items-center gap-3">
              {p.thumbnailUrl && (
                <img src={p.thumbnailUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-[var(--text)]">{p.title}</p>
                <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">
                  {p.sourceName ?? 'Fonte'}
                  {' · '}
                  {timeAgo(p.publishedAt ?? p.fetchedAt)}
                </p>
              </div>
              <ExternalLink size={14} className="shrink-0 text-[var(--text-muted)]" />
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}
