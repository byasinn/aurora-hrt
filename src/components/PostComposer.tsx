import { useEffect, useRef, useState } from 'react'
import { Plus, X, Palette } from 'lucide-react'
import clsx from 'clsx'
import { Button, Card } from './ui'
import Avatar from './Avatar'
import ImageCropper from './ImageCropper'
import { useCreatePost } from '../api/posts'
import { useProfile } from '../api/profile'
import { toastError } from '../lib/toast'
import { deleteImage } from '../lib/apiClient'
import { useThemeStore } from '../lib/themeStore'
import { FONT_STYLE_OPTIONS, fontStyleClass } from '../lib/postStyle'
import type { PostFontStyle } from '../../shared/types'

export default function PostComposer({ onPosted }: { onPosted?: () => void }) {
  const { data: profile } = useProfile()
  const createPost = useCreatePost()
  const theme = useThemeStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [cropQueue, setCropQueue] = useState<File[]>([])
  const [fontStyle, setFontStyle] = useState<PostFontStyle | null>(null)
  const [cardStyle, setCardStyle] = useState(false)
  const imagesRef = useRef(images)
  imagesRef.current = images

  // se o composer for desmontado (fechado, navegou pra outra tela) com fotos já subidas pro R2 mas
  // nunca postadas, apaga elas — senão ficam órfãs pra sempre contando pro limite de 30 por conta.
  // Só roda no unmount de verdade (array de deps vazio); handlePost já zera `images` antes de
  // desmontar num post bem-sucedido, então nesse caso o ref já está vazio e não apaga nada à toa.
  useEffect(() => {
    return () => {
      for (const url of imagesRef.current) deleteImage(url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setCropQueue((cur) => [...cur, ...files.slice(0, 4 - images.length - cur.length)])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleCropConfirm(dataUrl: string) {
    setImages((cur) => [...cur, dataUrl])
    setCropQueue((cur) => cur.slice(1))
  }

  function handleCropCancel() {
    setCropQueue((cur) => cur.slice(1))
  }

  async function handlePost() {
    if (!text.trim() && images.length === 0) return
    try {
      await createPost.mutateAsync({
        text: text.trim() || null,
        images,
        fontStyle,
        cardStyle,
        cardColor: cardStyle ? theme.accent : null,
        cardColor2: cardStyle ? theme.accent2 : null,
      })
      setText('')
      setImages([])
      setFontStyle(null)
      setCardStyle(false)
      onPosted?.()
    } catch (err) {
      toastError(err, 'Não foi possível publicar o post. Tenta de novo.')
    }
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
          className={clsx(
            'flex-1 resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]',
            fontStyleClass(fontStyle),
            cardStyle ? 'text-white placeholder:text-white/70 border-transparent' : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]',
          )}
          style={cardStyle ? { background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` } : undefined}
        />
      </div>
      <p className="text-[11px] text-[var(--text-muted)]">Cole um link do Pinterest pra mostrar o vídeo ou foto direto no post.</p>

      <div className="flex flex-wrap items-center gap-2">
        {FONT_STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => setFontStyle(opt.value)}
            className={clsx(
              'rounded-full border px-3 py-1 text-xs transition',
              opt.className,
              fontStyle === opt.value
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]',
            )}
          >
            Aa {opt.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCardStyle((v) => !v)}
          className={clsx(
            'flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition',
            cardStyle
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
              : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]',
          )}
        >
          <Palette size={12} /> Cartão
        </button>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
              <button
                onClick={() => {
                  deleteImage(src)
                  setImages((cur) => cur.filter((_, idx) => idx !== i))
                }}
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
            disabled={images.length + cropQueue.length >= 4}
          />
          <Plus size={16} />
        </label>
        <Button onClick={handlePost} disabled={createPost.isPending || (!text.trim() && images.length === 0)}>
          Postar
        </Button>
      </div>

      {cropQueue[0] && (
        <ImageCropper
          file={cropQueue[0]}
          aspect={1}
          shape="rect"
          outputSize={1080}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </Card>
  )
}
