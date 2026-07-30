import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, X, Trash2, Mail } from 'lucide-react'
import { Button, Card, EmptyState } from '../../components/ui'
import Avatar from '../../components/Avatar'
import MediaCollage from '../../components/MediaCollage'
import { usePosts, useCreatePost, useDeletePost } from '../../api/posts'
import { useProfile } from '../../api/profile'
import { useMessages } from '../../api/messages'
import { fileToFittedDataUrl } from '../../lib/image'

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

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)

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
        placeholder="Buscar nos posts…"
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

export default function FeedScreen() {
  const { data: posts, isLoading } = usePosts()
  const { data: profile } = useProfile()
  const deletePost = useDeletePost()
  const [composerOpen, setComposerOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filteredPosts = posts?.filter(
    (p) => !query.trim() || p.text?.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SearchBox value={query} onChange={setQuery} />
        <div className="flex-1" />
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
      {filteredPosts && filteredPosts.length === 0 && (
        <EmptyState>
          {query ? 'Nenhum post encontrado.' : 'Nenhum post ainda. Toque no + pra registrar um momento.'}
        </EmptyState>
      )}

      <div className="space-y-3">
        {filteredPosts?.map((post) => (
          <Card key={post.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} size={32} />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text)]">{profile?.displayName || 'Você'}</p>
                <p className="text-xs text-[var(--text-muted)]">{timeAgo(post.createdAt as unknown as string)}</p>
              </div>
              <button onClick={() => deletePost.mutate(post.id)} className="text-[var(--text-muted)]">
                <Trash2 size={16} />
              </button>
            </div>
            {post.text && <p className="whitespace-pre-wrap text-sm text-[var(--text)]">{post.text}</p>}
            <MediaCollage images={(post.images as string[]) ?? []} />
          </Card>
        ))}
      </div>
    </div>
  )
}
