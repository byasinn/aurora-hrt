import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Users, X, Palette } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { getCollectibleIcon } from '../../lib/collectibleIcons'
import { Button, Card, EmptyState, ScreenTitle } from '../../components/ui'
import Avatar from '../../components/Avatar'
import FeedItemCard from '../../components/FeedItemCard'
import CommunityPostComments from '../../components/CommunityPostComments'
import {
  useCommunity,
  useJoinCommunity,
  useLeaveCommunity,
  useCommunityFeed,
  useCreateCommunityPost,
  useDeleteCommunityPost,
  useLikeCommunityPost,
  useUnlikeCommunityPost,
} from '../../api/community'
import { useProfile } from '../../api/profile'
import { useMe } from '../../api/auth'
import ImageCropper from '../../components/ImageCropper'
import { toastError } from '../../lib/toast'
import { deleteImage } from '../../lib/apiClient'
import { useThemeStore } from '../../lib/themeStore'
import { FONT_STYLE_OPTIONS, fontStyleClass } from '../../lib/postStyle'
import type { PostFontStyle } from '../../../shared/types'

function Composer({ communityId }: { communityId: number }) {
  const { data: profile } = useProfile()
  const createPost = useCreateCommunityPost(communityId)
  const theme = useThemeStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [cropQueue, setCropQueue] = useState<File[]>([])
  const [fontStyle, setFontStyle] = useState<PostFontStyle | null>(null)
  const [cardStyle, setCardStyle] = useState(false)
  const imagesRef = useRef(images)
  imagesRef.current = images

  // mesmo fix do PostComposer.tsx: composer de comunidade some do DOM quando o usuário fecha (o + vira
  // X) sem postar — sem isso, fotos já subidas pro R2 ficam órfãs.
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
          placeholder="Compartilha algo com a comunidade…"
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

export default function CommunityScreen() {
  const { id } = useParams<{ id: string }>()
  const communityId = Number(id)
  const { data: community, isLoading } = useCommunity(communityId)
  const join = useJoinCommunity(communityId)
  const leave = useLeaveCommunity(communityId)
  const { data: feedPosts, isLoading: feedLoading } = useCommunityFeed(communityId, !!community?.isMember)
  const { data: me } = useMe(true)
  const [composerOpen, setComposerOpen] = useState(false)
  const likePost = useLikeCommunityPost()
  const unlikePost = useUnlikeCommunityPost()
  const deletePost = useDeleteCommunityPost()

  if (isLoading || !community) {
    return <p className="text-sm text-[var(--text-muted)]">Carregando…</p>
  }

  const CommunityIcon = getCollectibleIcon(community.icon) ?? Users

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/comunidades" className="flex h-8 w-8 items-center justify-center text-[var(--text-muted)]">
          <ArrowLeft size={18} />
        </Link>
        <ScreenTitle>{community.name}</ScreenTitle>
      </div>
      <Card className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
          <CommunityIcon size={22} />
        </div>
        <div className="flex-1">
          {community.description && <p className="text-xs text-[var(--text-muted)]">{community.description}</p>}
          {community.isAdmin ? (
            <Link to={`/comunidade/${communityId}/membros`} className="flex items-center gap-1 text-xs text-[var(--accent)] underline">
              <Users size={12} />
              {community.memberCount} membro{community.memberCount === 1 ? '' : 's'} · você é admin
            </Link>
          ) : (
            <p className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Users size={12} />
              {community.memberCount} membro{community.memberCount === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <Button
          variant={community.isMember ? 'secondary' : 'primary'}
          onClick={() => (community.isMember ? leave.mutate() : join.mutate())}
          disabled={join.isPending || leave.isPending}
        >
          {community.isMember ? 'Sair' : 'Entrar'}
        </Button>
      </Card>

      {!community.isMember ? (
        <p className="text-sm text-[var(--text-muted)]">Entra na comunidade pra ver e postar por aqui.</p>
      ) : (
        <>
          <div className="flex items-center justify-end">
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
                <Composer communityId={communityId} />
              </motion.div>
            )}
          </AnimatePresence>

          {feedLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
          {feedPosts && feedPosts.length === 0 && (
            <EmptyState>Nenhum post por aqui ainda. Toque no + pra postar algo.</EmptyState>
          )}

          <div className="space-y-3">
            {feedPosts?.map((post) => (
              <FeedItemCard
                key={post.id}
                kind="community"
                text={post.text}
                images={post.images}
                createdAt={post.createdAt as unknown as string}
                author={post.author}
                likeCount={post.likeCount}
                commentCount={post.commentCount}
                likedByMe={post.likedByMe}
                isOwn={post.userId === me?.id}
                fontStyle={post.fontStyle}
                cardStyle={post.cardStyle}
                cardColor={post.cardColor}
                cardColor2={post.cardColor2}
                reportTargetType="community_post"
                reportTargetId={post.id}
                onLike={() => likePost.mutate(post.id)}
                onUnlike={() => unlikePost.mutate(post.id)}
                onDelete={post.userId === me?.id || me?.isAdmin ? () => deletePost.mutate(post.id) : undefined}
                renderComments={() => <CommunityPostComments postId={post.id} />}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
