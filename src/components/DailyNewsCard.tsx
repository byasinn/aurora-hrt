import { Newspaper, ExternalLink } from 'lucide-react'
import { Card } from './ui'
import { timeAgo } from '../lib/dateUtils'
import { useDailyTopicPost } from '../api/topics'

/** Uma notícia só, sorteada por dia (todo mundo vê a mesma, muda uma vez por dia) — troca a ideia
 * antiga de várias páginas de tópico + feed cheio de post automático, que ficou ruim na prática
 * (fotos faltando em boa parte das fontes, virou um monte de notícia sem parar). */
export default function DailyNewsCard() {
  const { data: post, isLoading } = useDailyTopicPost()

  if (isLoading || !post) return null

  return (
    <a href={post.url} target="_blank" rel="noopener noreferrer">
      <Card className="space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--accent)]">
          <Newspaper size={12} /> Notícia do dia · em teste
        </div>
        <div className="flex items-center gap-3">
          {post.thumbnailUrl && (
            <img src={post.thumbnailUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-medium text-[var(--text)]">{post.title}</p>
            <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">
              {post.sourceName ?? 'Fonte'}
              {' · '}
              {timeAgo(post.publishedAt ?? post.fetchedAt)}
            </p>
          </div>
          <ExternalLink size={14} className="shrink-0 text-[var(--text-muted)]" />
        </div>
      </Card>
    </a>
  )
}
