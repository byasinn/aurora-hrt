import { Link } from 'react-router-dom'
import { Trash2 } from '../../components/icons'
import { Card } from '../../components/ui'
import { useAdminContent } from '../../api/adminPanel'
import { useDeletePost } from '../../api/posts'
import { useDeleteCommunityPost } from '../../api/community'
import { useQueryClient } from '@tanstack/react-query'
import { toastError } from '../../lib/toast'

/** Últimos posts do app inteiro (Explorar + comunidades) — moderação ativa, sem esperar denúncia. */
export default function AdminContent() {
  const { data, isLoading } = useAdminContent()
  const deletePost = useDeletePost()
  const deleteCommunityPost = useDeleteCommunityPost()
  const qc = useQueryClient()

  function remove(kind: 'post' | 'community', id: number) {
    if (!confirm('Apagar esse post? Ele some pra todo mundo e fica no registro de moderação.')) return
    const opts = { onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'content'] }), onError: (e: unknown) => toastError(e) }
    if (kind === 'post') deletePost.mutate(id, opts)
    else deleteCommunityPost.mutate(id, opts)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Conteúdo recente</h1>
        <p className="text-sm text-[var(--text-muted)]">Os últimos posts do Explorar e das comunidades.</p>
      </div>
      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      <div className="grid gap-3 lg:grid-cols-2">
        {data?.map((item) => (
          <Card key={`${item.kind}-${item.id}`} className="flex gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[var(--text-muted)]">
                {item.author?.username ? (
                  <Link to={`/u/${item.author.username}`} className="font-bold text-[var(--text)]">
                    {item.author.displayName || `@${item.author.username}`}
                  </Link>
                ) : (
                  'conta apagada'
                )}{' '}
                · {item.kind === 'community' ? 'comunidade' : 'Explorar'} ·{' '}
                {new Date(item.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
              <p className="user-text mt-1 line-clamp-4 whitespace-pre-wrap text-sm">{item.text || '(sem texto)'}</p>
              {item.images.length > 0 && (
                <div className="mt-2 flex gap-1.5">
                  {item.images.slice(0, 4).map((src, i) => (
                    <img key={i} src={src} alt="" loading="lazy" className="h-16 w-16 rounded-lg object-cover" />
                  ))}
                </div>
              )}
            </div>
            <button aria-label="Apagar post" onClick={() => remove(item.kind, item.id)} className="h-fit shrink-0 p-1 text-red-500">
              <Trash2 size={17} />
            </button>
          </Card>
        ))}
      </div>
    </div>
  )
}
