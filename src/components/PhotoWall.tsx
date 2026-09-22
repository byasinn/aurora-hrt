import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import clsx from 'clsx'
import { usePosts } from '../api/posts'
import { fontStyleClass } from '../lib/postStyle'
import type { Post } from '../../shared/types'

export type CollageStyle = 'grid' | 'row' | 'masonry'

/** Hash simples e estável (mesma chave sempre dá o mesmo resultado) — usado só pra variar proporção no masonry. */
function tileVariant(key: string): 0 | 1 {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0
  return (Math.abs(h) % 2) as 0 | 1
}

type WallTile =
  | { type: 'image'; key: string; src: string; imageIndex: number }
  | { type: 'text'; key: string; text: string; fontStyle: string | null; cardStyle: boolean; cardColor: string | null; cardColor2: string | null }

function PhotoLightbox({ images, index, onClose, onNavigate }: { images: string[]; index: number; onClose: () => void; onNavigate: (i: number) => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
        >
          <X size={18} />
        </button>

        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNavigate((index - 1 + images.length) % images.length)
            }}
            className="absolute left-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <motion.img
          key={index}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          src={images[index]}
          alt=""
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full rounded-lg object-contain"
        />

        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNavigate((index + 1) % images.length)
            }}
            className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/** Mural dos posts — fotos viram quadrinho, posts só de texto viram um card com o texto. Toque numa foto abre em tela cheia. */
export default function PhotoWall({
  posts: postsProp,
  style = 'grid',
}: {
  posts?: Post[]
  style?: CollageStyle
} = {}) {
  const { data: ownPosts } = usePosts(postsProp === undefined)
  const posts = postsProp ?? ownPosts

  const images: string[] = []
  const tiles: WallTile[] = []
  for (const p of posts ?? []) {
    const postImages = (p.images as string[] | null) ?? []
    if (postImages.length > 0) {
      for (const src of postImages) {
        tiles.push({ type: 'image', key: `${p.id}-${images.length}`, src, imageIndex: images.length })
        images.push(src)
      }
    } else if (p.text?.trim()) {
      tiles.push({
        type: 'text',
        key: `${p.id}-text`,
        text: p.text,
        fontStyle: p.fontStyle ?? null,
        cardStyle: !!p.cardStyle,
        cardColor: p.cardColor ?? null,
        cardColor2: p.cardColor2 ?? null,
      })
    }
  }

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (tiles.length === 0) return null

  const shown = style === 'row' ? tiles.slice(0, 12) : tiles.slice(0, 9)

  function imgClassFor(tile: WallTile & { type: 'image' }) {
    if (style === 'row') return 'h-32 w-32 shrink-0 rounded-md object-cover'
    if (style === 'masonry') {
      // padrão de proporção — ou quadrada (1:1) ou comprida (retrato) — não o formato bruto da foto original
      return clsx('w-full rounded-md object-cover', tileVariant(tile.key) === 0 ? 'aspect-square' : 'aspect-[3/4]')
    }
    return 'aspect-square w-full rounded-md object-cover'
  }

  function textTileClassFor(tile: WallTile & { type: 'text' }) {
    if (style === 'row') return 'flex h-32 w-32 shrink-0 items-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-2'
    if (style === 'masonry') {
      return clsx(
        'flex items-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3',
        tileVariant(tile.key) === 0 ? 'min-h-[76px]' : 'min-h-[152px]',
      )
    }
    return 'flex aspect-square items-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-2'
  }

  const containerClass =
    style === 'row'
      ? 'flex gap-1.5 overflow-x-auto pb-1'
      : style === 'masonry'
        ? 'columns-2 gap-1.5 [&>*]:mb-1.5 [&>*]:block'
        : 'grid grid-cols-3 gap-1'

  return (
    <>
      <div className={containerClass}>
        {shown.map((tile) =>
          tile.type === 'image' ? (
            <button key={tile.key} type="button" onClick={() => setOpenIndex(tile.imageIndex)} className="block">
              <img src={tile.src} alt="" className={imgClassFor(tile)} />
            </button>
          ) : (
            <div
              key={tile.key}
              className={textTileClassFor(tile)}
              style={
                tile.cardStyle
                  ? { background: `linear-gradient(135deg, ${tile.cardColor ?? 'var(--accent)'}, ${tile.cardColor2 ?? 'var(--accent-2)'})` }
                  : undefined
              }
            >
              <p
                className={clsx(
                  'text-xs',
                  style === 'masonry' && tileVariant(tile.key) === 1 ? 'line-clamp-6' : 'line-clamp-3',
                  fontStyleClass(tile.fontStyle),
                  tile.cardStyle ? 'text-white' : 'text-[var(--text)]',
                )}
              >
                {tile.text}
              </p>
            </div>
          ),
        )}
      </div>

      {openIndex != null && (
        <PhotoLightbox images={images} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
      )}
    </>
  )
}
