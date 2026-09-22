import { useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageSquare, Trash2, Repeat2 } from 'lucide-react'
import clsx from 'clsx'
import { Card } from './ui'
import Avatar from './Avatar'
import MediaCollage from './MediaCollage'
import PinterestEmbed from './PinterestEmbed'
import VerifiedBadge from './VerifiedBadge'
import ReportButton from './ReportButton'
import { findPinterestUrl, stripUrlFromText } from '../lib/pinterest'
import { fontStyleClass } from '../lib/postStyle'
import type { PublicUserSummary, RepostOriginal, ReportTargetType } from '../../shared/types'

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString('pt-BR')
}

export interface FeedItemCardProps {
  kind: 'post' | 'community'
  text: string | null
  images: unknown
  createdAt: string
  author: PublicUserSummary
  likeCount: number
  commentCount: number
  likedByMe: boolean
  isOwn: boolean
  communityName?: string | null
  fontStyle?: string | null
  cardStyle?: boolean
  cardColor?: string | null
  cardColor2?: string | null
  repostOf?: RepostOriginal | null
  repostCount?: number
  repostedByMe?: boolean
  reportTargetType?: ReportTargetType
  reportTargetId?: number
  onLike: () => void
  onUnlike: () => void
  onDelete?: () => void
  onRepost?: () => void
  onUnrepost?: () => void
  renderComments: () => ReactNode
}

export default function FeedItemCard({
  kind,
  text,
  images,
  createdAt,
  author,
  likeCount,
  commentCount,
  likedByMe,
  isOwn,
  communityName,
  fontStyle,
  cardStyle,
  cardColor,
  cardColor2,
  repostOf,
  repostCount = 0,
  repostedByMe = false,
  reportTargetType,
  reportTargetId,
  onLike,
  onUnlike,
  onDelete,
  onRepost,
  onUnrepost,
  renderComments,
}: FeedItemCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [burst, setBurst] = useState(false)
  const lastTapRef = useRef(0)

  // conteúdo "efetivo" — se for repost, mostra o original; senão, o próprio item
  const content = repostOf ?? {
    author,
    text,
    images,
    fontStyle: fontStyle ?? null,
    cardStyle: !!cardStyle,
    cardColor: cardColor ?? null,
    cardColor2: cardColor2 ?? null,
  }
  const canRepost = (repostOf?.kind ?? kind) === 'post'

  const pinterestUrl = content.text ? findPinterestUrl(content.text) : null
  const displayText = pinterestUrl && content.text ? stripUrlFromText(content.text, pinterestUrl) : content.text

  function handleMediaTap() {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      if (!likedByMe) onLike()
      setBurst(true)
      setTimeout(() => setBurst(false), 700)
    }
    lastTapRef.current = now
  }

  function handleDeleteClick() {
    const message = isOwn
      ? 'Apagar esse post?'
      : `Apagar o post de ${content.author.displayName || 'essa pessoa'}? Isso fica registrado no log de moderação.`
    if (confirm(message)) onDelete?.()
  }

  return (
    <Card className="space-y-2">
      {repostOf && (
        <p className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)]">
          <Repeat2 size={13} /> {isOwn ? 'Você' : author.displayName || 'Alguém'} repostou
        </p>
      )}

      <div className="flex items-center gap-2">
        <Link
          to={!repostOf && isOwn ? '/profile' : `/u/${content.author.username}`}
          className="flex flex-1 items-center gap-2"
        >
          <Avatar src={content.author.avatarUrl} icon={content.author.avatarIcon} name={content.author.displayName} size={32} />
          <div className="flex-1">
            <p className="flex items-center gap-1 text-sm font-medium text-[var(--text)]">
              {!repostOf && isOwn ? 'Você' : content.author.displayName || 'Sem nome'}
              {content.author.isVerified && <VerifiedBadge size={13} />}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {timeAgo(createdAt)}
              {communityName && ` · ${communityName}`}
            </p>
          </div>
        </Link>
        {!isOwn && reportTargetType && reportTargetId != null && (
          <ReportButton targetType={reportTargetType} targetId={reportTargetId} className="text-[var(--text-muted)]" iconSize={16} />
        )}
        {onDelete && (
          <button onClick={handleDeleteClick} className="text-[var(--text-muted)]">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {displayText &&
        (content.cardStyle ? (
          <p
            className={clsx('whitespace-pre-wrap rounded-xl px-3 py-3 text-sm text-white', fontStyleClass(content.fontStyle))}
            style={{ background: `linear-gradient(135deg, ${content.cardColor ?? 'var(--accent)'}, ${content.cardColor2 ?? 'var(--accent-2)'})` }}
          >
            {displayText}
          </p>
        ) : (
          <p className={clsx('whitespace-pre-wrap text-sm text-[var(--text)]', fontStyleClass(content.fontStyle))}>{displayText}</p>
        ))}
      {pinterestUrl && <PinterestEmbed url={pinterestUrl} />}

      <div className="relative" onClick={handleMediaTap}>
        <MediaCollage images={(content.images as string[]) ?? []} />
        <AnimatePresence>
          {burst && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.15 }}
              exit={{ opacity: 0, scale: 1.3 }}
              transition={{ duration: 0.35 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <Heart size={72} className="text-white drop-shadow-lg" fill="currentColor" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4 pt-1 text-xs text-[var(--text-muted)]">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => (likedByMe ? onUnlike() : onLike())}
          className={clsx('flex items-center gap-1', likedByMe && 'text-red-500')}
        >
          <Heart size={16} fill={likedByMe ? 'currentColor' : 'none'} />
          {likeCount > 0 && likeCount}
        </motion.button>
        <button onClick={() => setCommentsOpen((o) => !o)} className="flex items-center gap-1">
          <MessageSquare size={16} />
          {commentCount > 0 && commentCount}
        </button>
        {canRepost && (onRepost || onUnrepost) && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => (repostedByMe ? onUnrepost?.() : onRepost?.())}
            className={clsx('flex items-center gap-1', repostedByMe && 'text-emerald-500')}
          >
            <Repeat2 size={16} />
            {repostCount > 0 && repostCount}
          </motion.button>
        )}
      </div>

      {commentsOpen && renderComments()}
    </Card>
  )
}
