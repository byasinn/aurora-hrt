import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, X, Trash2, Mail, MessageCircle, Heart, MessageSquare } from 'lucide-react'
import clsx from 'clsx'
import { Button, Card, EmptyState } from '../../components/ui'
import Avatar from '../../components/Avatar'
import MediaCollage from '../../components/MediaCollage'
import PostComments from '../../components/PostComments'
import { useCreatePost, useDeletePost } from '../../api/posts'
import { useProfile } from '../../api/profile'
import { useMe } from '../../api/auth'
import { useMessages } from '../../api/messages'
import { useConversations } from '../../api/dm'
import { useFeed, useLikePost, useUnlikePost, useUserSearch } from '../../api/social'
import { fileToFittedDataUrl } from '../../lib/image'
import type { FeedPost } from '../../../shared/types'

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

function PeopleSearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const { data: results } = useUserSearch(value)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)]"
      >
        <Search size={20} />
      </button>
    )
  }

  return (
    <div className="relative flex-1">
      <motion.div
        initial={{ width: 36 }}
        animate={{ width: '100%' }}
        className="flex items-center gap-1 rounded-full border border-[var(--accent)] bg-[var(--surface-2)] px-3 py-1.5"
      >
        <Search size={16} className="text-[var(--accent)]" />
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar pessoas…"
          className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none"
        />
        <button
          onClick={() => {
            setOpen(false)
            onChange('')
          }}
        >
          <X size={16} className="text-[var(--text-muted)]" />
        </button>
      </motion.div>

      {value.trim() && (
        <Card className="absolute left-0 right-0 top-11 z-20 max-h-72 space-y-1 overflow-y-auto p-2">
          {results?.length === 0 && <p className="p-2 text-xs text-[var(--text-muted)]">Ninguém encontrado.</p>}
          {results?.map((r) => (
            <Link
              key={r.userId}
              to={`/u/${r.userId}`}
              onClick={() => {
                setOpen(false)
                onChange('')
              }}
              className="flex items-center gap-2 rounded-lg p-2 hover:bg-[var(--surface-2)]"
            >
              <Avatar src={r.avatarUrl} icon={r.avatarIcon} name={r.displayName} size={32} />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text)]">{r.displayName || 'Sem nome'}</p>
                <p className="text-xs text-[var(--text-muted)]">{r.pronouns}</p>
              </div>
              {r.isFollowedByMe && <span className="text-[10px] text-[var(--accent)]">Seguindo</span>}
            </Link>
          ))}
        </Card>
      )}
    </div>
  )
}

function MessagesIcon() {
  const { data: messages } = useMessages()
  const unread = messages?.filter((m) => !m.read).length ?? 0

  return (
    <Link to="/messages" className="relative flex h-9 w-9 items-center justify-center text-[var(--text-muted)]">
      <Mail size={20} />
      {unread > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
          {unread}
        </span>
      )}
    </Link>
  )
}

function ConversationsIcon() {
  const { data: threads } = useConversations()
  const unread = threads?.reduce((sum, t) => sum + t.unreadCount, 0) ?? 0

  return (
    <Link to="/conversas" className="relative flex h-9 w-9 items-center justify-center text-[var(--text-muted)]">
      <MessageCircle size={20} />
      {unread > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
          {unread}
        </span>
      )}
    </Link>
  )
}

function Composer() {
  const { data: profile } = useProfile()
  const createPost = useCreatePost()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    try {
      const dataUrls = await Promise.all(files.slice(0, 4 - images.length).map((f) => fileToFittedDataUrl(f)))
      setImages((cur) => [...cur, ...dataUrls])
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handlePost() {
    if (!text.trim() && images.length === 0) return
    await createPost.mutateAsync({ text: text.trim() || null, images })
    setText('')
    setImages([])
  }

  return (
    <Card className="space-y-3">
      <div className="flex gap-2">
        <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} size={36} />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="No que você está pensando?"
          rows={2}
          className="flex-1 resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
              <button
                onClick={() => setImages((cur) => cur.filter((_, idx) => idx !== i))}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] text-[var(--accent)]">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
            disabled={images.length >= 4}
          />
          {uploading ? <span className="h-3 w-3 animate-pulse rounded-full bg-[var(--accent)]" /> : <Plus size={16} />}
        </label>
        <Button onClick={handlePost} disabled={createPost.isPending || (!text.trim() && images.length === 0)}>
          Postar
        </Button>
      </div>
    </Card>
  )
}

function FeedPostCard({ post, myUserId }: { post: FeedPost; myUserId?: number }) {
  const deletePost = useDeletePost()
  const likePost = useLikePost()
  const unlikePost = useUnlikePost()
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [burst, setBurst] = useState(false)
  const isOwn = post.userId === myUserId
  const lastTapRef = useRef(0)

  function handleMediaTap() {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      if (!post.likedByMe) likePost.mutate(post.id)
      setBurst(true)
      setTimeout(() => setBurst(false), 700)
    }
    lastTapRef.current = now
  }

  return (
    <Card className="space-y-2">
      <div className="flex items-center gap-2">
        <Link to={isOwn ? '/profile' : `/u/${post.author.userId}`} className="flex flex-1 items-center gap-2">
          <Avatar src={post.author.avatarUrl} icon={post.author.avatarIcon} name={post.author.displayName} size={32} />
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--text)]">
              {isOwn ? 'Você' : post.author.displayName || 'Sem nome'}
            </p>
            <p className="text-xs text-[var(--text-muted)]">{timeAgo(post.createdAt as unknown as string)}</p>
          </div>
        </Link>
        {isOwn && (
          <button onClick={() => deletePost.mutate(post.id)} className="text-[var(--text-muted)]">
            <Trash2 size={16} />
          </button>
        )}
      </div>
      {post.text && <p className="whitespace-pre-wrap text-sm text-[var(--text)]">{post.text}</p>}

      <div className="relative" onClick={handleMediaTap}>
        <MediaCollage images={(post.images as string[]) ?? []} />
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
        <button
          onClick={() => (post.likedByMe ? unlikePost.mutate(post.id) : likePost.mutate(post.id))}
          className={clsx('flex items-center gap-1', post.likedByMe && 'text-red-500')}
        >
          <Heart size={16} fill={post.likedByMe ? 'currentColor' : 'none'} />
          {post.likeCount > 0 && post.likeCount}
        </button>
        <button onClick={() => setCommentsOpen((o) => !o)} className="flex items-center gap-1">
          <MessageSquare size={16} />
          {post.commentCount > 0 && post.commentCount}
        </button>
      </div>

      {commentsOpen && <PostComments postId={post.id} />}
    </Card>
  )
}

export default function FeedScreen() {
  const { data: feedPosts, isLoading } = useFeed()
  const { data: me } = useMe(true)
  const [composerOpen, setComposerOpen] = useState(false)
  const [query, setQuery] = useState('')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PeopleSearchBox value={query} onChange={setQuery} />
        <div className="flex-1" />
        <ConversationsIcon />
        <MessagesIcon />
        <button
          onClick={() => setComposerOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]"
        >
          <motion.span animate={{ rotate: composerOpen ? 45 : 0 }} className="flex">
            <Plus size={20} />
          </motion.span>
        </button>
      </div>

      <AnimatePresence>
        {composerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Composer />
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {feedPosts && feedPosts.length === 0 && (
        <EmptyState>
          Nenhum post por aqui ainda. Busca pessoas pra seguir ou toque no + pra postar algo.
        </EmptyState>
      )}

      <div className="space-y-3">
        {feedPosts?.map((post) => (
          <FeedPostCard key={post.id} post={post} myUserId={me?.id} />
        ))}
      </div>
    </div>
  )
}
