import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import Avatar from './Avatar'
import { useCreateComment, useDeleteComment, usePostComments } from '../api/social'
import { useMe } from '../api/auth'

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export default function PostComments({ postId }: { postId: number }) {
  const { data: comments, isLoading } = usePostComments(postId)
  const { data: me } = useMe(true)
  const createComment = useCreateComment()
  const deleteComment = useDeleteComment()
  const [text, setText] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    createComment.mutate({ postId, text: text.trim() })
    setText('')
  }

  return (
    <div className="space-y-2 border-t border-[var(--border)] pt-2">
      {isLoading && <p className="text-xs text-[var(--text-muted)]">Carregando…</p>}
      {comments?.length === 0 && <p className="text-xs text-[var(--text-muted)]">Nenhum comentário ainda.</p>}
      {comments?.map((c) => (
        <div key={c.id} className="flex items-start gap-2">
          <Avatar src={c.author.avatarUrl} icon={c.author.avatarIcon} name={c.author.displayName} size={24} />
          <div className="flex-1">
            <p className="text-xs">
              <span className="font-medium text-[var(--text)]">{c.author.displayName || 'Alguém'}</span>{' '}
              <span className="text-[var(--text-muted)]">{timeAgo(c.createdAt as unknown as string)}</span>
            </p>
            <p className="text-sm text-[var(--text)]">{c.text}</p>
          </div>
          {c.userId === me?.id && (
            <button onClick={() => deleteComment.mutate(c.id)} className="text-[var(--text-muted)]">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      ))}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva um comentário…"
          className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={createComment.isPending || !text.trim()}
          className="text-sm font-medium text-[var(--accent)] disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
