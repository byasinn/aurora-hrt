import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2, MessageCircle } from 'lucide-react'
import clsx from 'clsx'
import Avatar from './Avatar'
import VerifiedBadge from './VerifiedBadge'
import ReportButton from './ReportButton'
import type { ReportTargetType } from '../../shared/types'

interface CommentAuthor {
  userId: number
  username: string
  displayName: string
  avatarUrl: string | null
  avatarIcon: string | null
  isVerified: boolean
}

interface CommentLike {
  id: number
  userId: number
  parentCommentId: number | null
  text: string
  createdAt: string | Date
  author: CommentAuthor
  likeCount: number
  likedByMe: boolean
  replies: CommentLike[]
}

function timeAgo(iso: string | Date): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function CommentRow({
  comment,
  meId,
  isAdmin,
  commentTargetType,
  onDelete,
  onLike,
  onUnlike,
  onReply,
  isReply,
}: {
  comment: CommentLike
  meId?: number
  isAdmin?: boolean
  commentTargetType: ReportTargetType
  onDelete: (id: number) => void
  onLike: (id: number) => void
  onUnlike: (id: number) => void
  onReply: (comment: CommentLike) => void
  isReply?: boolean
}) {
  return (
    <div className={clsx('flex items-start gap-2', isReply && 'ml-8')}>
      <Link to={`/u/${comment.author.username}`}>
        <Avatar src={comment.author.avatarUrl} icon={comment.author.avatarIcon} name={comment.author.displayName} size={isReply ? 20 : 24} />
      </Link>
      <div className="flex-1">
        <p className="text-xs">
          <Link to={`/u/${comment.author.username}`} className="inline-flex items-center gap-0.5 font-medium text-[var(--text)]">
            {comment.author.displayName || 'Alguém'}
            {comment.author.isVerified && <VerifiedBadge size={11} />}
          </Link>{' '}
          <span className="text-[var(--text-muted)]">{timeAgo(comment.createdAt)}</span>
        </p>
        <p className="text-sm text-[var(--text)]">{comment.text}</p>
        <div className="mt-1 flex items-center gap-3">
          <button
            onClick={() => (comment.likedByMe ? onUnlike(comment.id) : onLike(comment.id))}
            className={clsx('flex items-center gap-1 text-[11px]', comment.likedByMe ? 'text-red-500' : 'text-[var(--text-muted)]')}
          >
            <Heart size={12} fill={comment.likedByMe ? 'currentColor' : 'none'} />
            {comment.likeCount > 0 && comment.likeCount}
          </button>
          {!isReply && (
            <button onClick={() => onReply(comment)} className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
              <MessageCircle size={12} /> Responder
            </button>
          )}
          {comment.userId !== meId && (
            <ReportButton
              targetType={commentTargetType}
              targetId={comment.id}
              iconSize={11}
              className="text-[var(--text-muted)]"
            />
          )}
          {(comment.userId === meId || isAdmin) && (
            <button
              onClick={() => {
                const isOwnComment = comment.userId === meId
                const message = isOwnComment
                  ? 'Apagar esse comentário?'
                  : `Apagar o comentário de ${comment.author.displayName || 'essa pessoa'}? Isso fica registrado no log de moderação.`
                if (confirm(message)) onDelete(comment.id)
              }}
              className="text-[var(--text-muted)]"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>

        {comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply) => (
              <CommentRow
                key={reply.id}
                comment={reply}
                meId={meId}
                isAdmin={isAdmin}
                commentTargetType={commentTargetType}
                onDelete={onDelete}
                onLike={onLike}
                onUnlike={onUnlike}
                onReply={onReply}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CommentThread({
  comments,
  isLoading,
  meId,
  isAdmin,
  commentTargetType,
  onCreate,
  onDelete,
  onLike,
  onUnlike,
  creating,
}: {
  comments: CommentLike[] | undefined
  isLoading: boolean
  meId?: number
  isAdmin?: boolean
  commentTargetType: ReportTargetType
  onCreate: (input: { text: string; parentCommentId?: number | null }) => void
  onDelete: (id: number) => void
  onLike: (id: number) => void
  onUnlike: (id: number) => void
  creating: boolean
}) {
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<CommentLike | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    onCreate({ text: text.trim(), parentCommentId: replyTo?.id ?? null })
    setText('')
    setReplyTo(null)
  }

  return (
    <div className="space-y-2 border-t border-[var(--border)] pt-2">
      {isLoading && <p className="text-xs text-[var(--text-muted)]">Carregando…</p>}
      {comments?.length === 0 && <p className="text-xs text-[var(--text-muted)]">Nenhum comentário ainda.</p>}
      {comments?.map((c) => (
        <CommentRow
          key={c.id}
          comment={c}
          meId={meId}
          isAdmin={isAdmin}
          commentTargetType={commentTargetType}
          onDelete={onDelete}
          onLike={onLike}
          onUnlike={onUnlike}
          onReply={setReplyTo}
        />
      ))}

      <form onSubmit={handleSubmit} className="space-y-1 pt-1">
        {replyTo && (
          <div className="flex items-center justify-between rounded-lg bg-[var(--surface-2)] px-2 py-1 text-[11px] text-[var(--text-muted)]">
            Respondendo {replyTo.author.displayName || 'alguém'}
            <button type="button" onClick={() => setReplyTo(null)} className="text-[var(--accent)]">
              cancelar
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={replyTo ? 'Escreva uma resposta…' : 'Escreva um comentário…'}
            className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
          <button type="submit" disabled={creating || !text.trim()} className="text-sm font-medium text-[var(--accent)] disabled:opacity-50">
            Enviar
          </button>
        </div>
      </form>
    </div>
  )
}
