import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { Pin, Lock as LockIcon } from 'lucide-react'
import { ArrowLeft, Heart, MessageCircle, Send, Trash2 } from '../../components/icons'
import { Button, Card, EmptyState } from '../../components/ui'
import Avatar from '../../components/Avatar'
import ReportButton from '../../components/ReportButton'
import { useDeleteReply, useDeleteTopic, useForumTopic, useLikeTopic, useReplyTopic, useUpdateTopic } from '../../api/forum'
import { useMe } from '../../api/auth'
import { REPLY_MAX, type ForumAuthor } from '../../../shared/forum'
import { TagChip } from './ForumScreen'
import { timeAgo } from '../../lib/dateUtils'
import { playSound } from '../../lib/sounds'
import { toastError } from '../../lib/toast'

function AuthorLine({ author, at }: { author: ForumAuthor | null; at: string }) {
  const name = author ? author.displayName || `@${author.username}` : 'conta apagada'
  return (
    <div className="flex items-center gap-2">
      <Avatar src={author?.avatarUrl} icon={author?.avatarIcon} name={author?.displayName ?? undefined} frame={author?.frame} size={30} />
      <div className="min-w-0 flex-1 text-xs">
        {author?.username ? (
          <Link to={`/u/${author.username}`} className="font-bold text-[var(--text)]">
            {name}
          </Link>
        ) : (
          <span className="font-bold">{name}</span>
        )}
        {author?.isAdmin && <span className="ml-1 rounded-full bg-[var(--accent)] px-1.5 text-[10px] font-bold text-[var(--accent-contrast)]">equipe</span>}
        <p className="text-[var(--text-muted)]">{timeAgo(at)}</p>
      </div>
    </div>
  )
}

export default function TopicScreen() {
  const { id } = useParams<{ id: string }>()
  const topicId = Number(id)
  const navigate = useNavigate()
  const { data: topic, isLoading, isError } = useForumTopic(topicId)
  const { data: me } = useMe(true)
  const like = useLikeTopic()
  const reply = useReplyTopic()
  const update = useUpdateTopic()
  const deleteTopic = useDeleteTopic()
  const deleteReply = useDeleteReply()
  const [text, setText] = useState('')

  if (isLoading) return <p className="text-sm text-[var(--text-muted)]">Carregando…</p>
  if (isError || !topic) return <EmptyState>Esse tópico não existe mais.</EmptyState>

  const isAdmin = !!me?.isAdmin
  const isOwner = me?.id === topic.author?.id
  const canReply = !topic.locked || isAdmin

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    reply.mutate(
      { topicId, body: text.trim() },
      {
        onSuccess: () => {
          playSound('pop')
          setText('')
        },
        onError: (err) => toastError(err),
      },
    )
  }

  function toggleFlag(flag: 'pinned' | 'locked') {
    update.mutate({ id: topicId, [flag]: !topic![flag] }, { onError: (e) => toastError(e) })
  }

  function removeTopic() {
    if (!confirm(isOwner ? 'Apagar seu tópico? As respostas somem junto.' : 'Apagar esse tópico? Fica no registro de moderação.')) return
    deleteTopic.mutate(topicId, { onSuccess: () => navigate('/comunidades', { replace: true }), onError: (e) => toastError(e) })
  }

  return (
    <div className="space-y-4">
      <Link to="/comunidades" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ArrowLeft size={16} /> Comunidade
      </Link>

      <Card className="space-y-3">
        <div className="flex items-start gap-2">
          {topic.pinned && <Pin size={17} className="mt-1 shrink-0 text-[var(--accent)]" />}
          {topic.locked && <LockIcon size={16} className="mt-1 shrink-0 text-[var(--text-muted)]" />}
          <h1 className="user-text min-w-0 flex-1 text-xl font-extrabold leading-snug">{topic.title}</h1>
        </div>
        <AuthorLine author={topic.author} at={topic.createdAt} />
        <p className="user-text whitespace-pre-wrap text-[15px] leading-relaxed">{topic.body}</p>
        {topic.editedAt && <p className="text-[11px] text-[var(--text-muted)]">editado {timeAgo(topic.editedAt)}</p>}
        <div className="flex flex-wrap gap-1.5">
          {topic.tags.map((t) => (
            <TagChip key={t} tag={t} />
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-[var(--border)] pt-3">
          <button
            onClick={() => {
              if (!topic.likedByMe) playSound('pop')
              like.mutate(topicId)
            }}
            className={clsx(
              'flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-bold',
              topic.likedByMe ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)]',
            )}
          >
            <Heart size={15} fill={topic.likedByMe ? 'currentColor' : 'none'} /> {topic.likeCount}
          </button>
          <span className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
            <MessageCircle size={15} /> {topic.replyCount}
          </span>
          <div className="flex-1" />
          {!isOwner && <ReportButton targetType="forum_topic" targetId={topic.id} />}
          {(isOwner || isAdmin) && (
            <button aria-label="Apagar tópico" onClick={removeTopic} className="p-1 text-red-500">
              <Trash2 size={16} />
            </button>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => toggleFlag('pinned')}>
              <Pin size={14} /> {topic.pinned ? 'Desafixar' : 'Fixar no topo'}
            </Button>
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => toggleFlag('locked')}>
              <LockIcon size={14} /> {topic.locked ? 'Destrancar' : 'Trancar respostas'}
            </Button>
          </div>
        )}
      </Card>

      <h2 className="px-1 text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
        {topic.replies.length} {topic.replies.length === 1 ? 'resposta' : 'respostas'}
      </h2>
      <div className="space-y-2">
        {topic.replies.map((r) => {
          const mine = me?.id === r.author?.id
          return (
            <Card key={r.id} className="space-y-2 p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <AuthorLine author={r.author} at={r.createdAt} />
                </div>
                {!mine && <ReportButton targetType="forum_reply" targetId={r.id} />}
                {(mine || isAdmin) && (
                  <button
                    aria-label="Apagar resposta"
                    onClick={() => confirm('Apagar essa resposta?') && deleteReply.mutate(r.id, { onError: (e) => toastError(e) })}
                    className="p-1 text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="user-text whitespace-pre-wrap text-sm">{r.body}</p>
            </Card>
          )
        })}
      </div>

      {canReply ? (
        <form onSubmit={submit} className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] flex items-end gap-2 lg:bottom-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={REPLY_MAX}
            rows={Math.min(5, Math.max(1, text.split('\n').length))}
            placeholder="Escreva uma resposta…"
            className="user-text flex-1 resize-none rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] outline-none [box-shadow:var(--shadow)] focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            aria-label="Enviar resposta"
            disabled={!text.trim() || reply.isPending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] disabled:opacity-50"
          >
            <Send size={17} />
          </button>
        </form>
      ) : (
        <p className="flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--surface-2)] p-3 text-sm text-[var(--text-muted)]">
          <LockIcon size={14} /> Esse tópico está trancado pra respostas.
        </p>
      )}
    </div>
  )
}
