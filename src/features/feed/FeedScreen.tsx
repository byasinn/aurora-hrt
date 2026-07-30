import { useRef, useState } from 'react'
import { Camera, Plus, X, Trash2 } from 'lucide-react'
import { Button, Card, EmptyState } from '../../components/ui'
import Avatar from '../../components/Avatar'
import MediaCollage from '../../components/MediaCollage'
import { usePosts, useCreatePost, useDeletePost } from '../../api/posts'
import { useProfile } from '../../api/profile'
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

function QuickPhotoButton() {
  const createPost = useCreatePost()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 4)
    if (files.length === 0) return
    setUploading(true)
    try {
      const images = await Promise.all(files.map((f) => fileToFittedDataUrl(f)))
      await createPost.mutateAsync({ text: null, images })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      {uploading ? <span className="h-4 w-4 animate-pulse rounded-full bg-white/60" /> : <Plus size={18} />}
    </label>
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
        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-[var(--accent)]">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
            disabled={images.length >= 4}
          />
          <Camera size={16} />
          {uploading ? 'Carregando…' : 'Fotos'}
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <QuickPhotoButton />
      </div>

      <Composer />

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {posts && posts.length === 0 && (
        <EmptyState>Nenhum post ainda. Registre um momento da sua jornada acima.</EmptyState>
      )}

      <div className="space-y-3">
        {posts?.map((post) => (
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
