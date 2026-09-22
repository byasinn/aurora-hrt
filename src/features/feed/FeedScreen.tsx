import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, X, ArrowUp } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, EmptyState } from '../../components/ui'
import Avatar from '../../components/Avatar'
import FeedItemCard from '../../components/FeedItemCard'
import PostComments from '../../components/PostComments'
import CommunityPostComments from '../../components/CommunityPostComments'
import PostComposer from '../../components/PostComposer'
import DailyNewsCard from '../../components/DailyNewsCard'
import FollowSuggestions from '../../components/FollowSuggestions'
import ExploreIntroBanner from '../../components/ExploreIntroBanner'
import { useDeletePost, useRepost } from '../../api/posts'
import { useMe } from '../../api/auth'
import { useFeed, useLikePost, useUnlikePost, useUserSearch } from '../../api/social'
import { api } from '../../lib/apiClient'
import type { FeedItem } from '../../../shared/types'
import { useLikeCommunityPost, useUnlikeCommunityPost, useDeleteCommunityPost } from '../../api/community'
import { toastError } from '../../lib/toast'

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
              to={`/u/${r.username}`}
              onClick={() => {
                setOpen(false)
                onChange('')
              }}
              className="flex items-center gap-2 rounded-lg p-2 hover:bg-[var(--surface-2)]"
            >
              <Avatar src={r.avatarUrl} icon={r.avatarIcon} name={r.displayName} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text)]">{r.displayName || 'Sem nome'}</p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  @{r.username}
                  {r.pronouns && ` · ${r.pronouns}`}
                </p>
              </div>
              {r.isFollowedByMe && <span className="text-[10px] text-[var(--accent)]">Seguindo</span>}
            </Link>
          ))}
        </Card>
      )}
    </div>
  )
}

/** "Novos posts" — espia o topo do feed a cada 45s sem trocar o que já está na tela (evita reflow
 * enquanto a pessoa lê), e só mostra o banner pra puxar os novos quando o topo realmente mudou. */
function useNewPostsBanner(currentTopKey: string | null) {
  const { data: peek } = useQuery({
    queryKey: ['feed-peek'],
    queryFn: () => api.get<FeedItem[]>('/feed'),
    refetchInterval: 45_000,
    enabled: currentTopKey != null,
  })
  const acknowledgedRef = useRef<string | null>(null)
  useEffect(() => {
    if (acknowledgedRef.current == null) acknowledgedRef.current = currentTopKey
  }, [currentTopKey])

  const peekTopKey = peek && peek.length > 0 ? `${peek[0].kind}-${peek[0].id}` : null
  const hasNew = peekTopKey != null && peekTopKey !== acknowledgedRef.current

  function acknowledge(newTopKey: string | null) {
    acknowledgedRef.current = newTopKey
  }

  return { hasNew, acknowledge }
}

export default function FeedScreen() {
  const { data: feedItems, isLoading } = useFeed()
  const { data: me } = useMe(true)
  const qc = useQueryClient()
  const [composerOpen, setComposerOpen] = useState(false)
  const [query, setQuery] = useState('')

  const topKey = feedItems && feedItems.length > 0 ? `${feedItems[0].kind}-${feedItems[0].id}` : null
  const { hasNew, acknowledge } = useNewPostsBanner(topKey)

  async function handleShowNewPosts() {
    const fresh = await qc.fetchQuery({ queryKey: ['feed'], queryFn: () => api.get<FeedItem[]>('/feed') })
    qc.setQueryData(['feed'], fresh)
    acknowledge(fresh.length > 0 ? `${fresh[0].kind}-${fresh[0].id}` : null)
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const likePost = useLikePost()
  const unlikePost = useUnlikePost()
  const deletePost = useDeletePost()
  const likeCommunityPost = useLikeCommunityPost()
  const unlikeCommunityPost = useUnlikeCommunityPost()
  const deleteCommunityPost = useDeleteCommunityPost()
  const repost = useRepost()
  const unrepost = useDeletePost()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PeopleSearchBox value={query} onChange={setQuery} />
        <div className="flex-1" />
        <button
          onClick={() => setComposerOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]"
        >
          <motion.span animate={{ rotate: composerOpen ? 45 : 0 }} className="flex">
            <Plus size={20} />
          </motion.span>
        </button>
      </div>

      <ExploreIntroBanner />

      <DailyNewsCard />

      <AnimatePresence>
        {hasNew && (
          <motion.button
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={handleShowNewPosts}
            className="sticky top-0 z-10 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-medium text-[var(--accent-contrast)] [box-shadow:var(--shadow)]"
          >
            <ArrowUp size={14} /> Novos posts
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {composerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <PostComposer onPosted={() => setComposerOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {feedItems && feedItems.length === 0 && (
        <EmptyState>
          Nenhum post por aqui ainda. Busca pessoas pra seguir ou toque no + pra postar algo.
        </EmptyState>
      )}

      <FollowSuggestions />

      <div className="space-y-3">
        {feedItems?.map((item) => {
          // se é um repost, curtir/comentar/repostar agem sobre o post original, não sobre o wrapper
          const target = item.repostOf ? { id: item.repostOf.id, kind: item.repostOf.kind } : { id: item.id, kind: item.kind }
          return (
            <FeedItemCard
              key={`${item.kind}-${item.id}`}
              kind={item.kind}
              text={item.text}
              images={item.images}
              createdAt={item.createdAt as unknown as string}
              author={item.author}
              likeCount={item.likeCount}
              commentCount={item.commentCount}
              likedByMe={item.likedByMe}
              isOwn={item.userId === me?.id}
              communityName={item.communityName}
              fontStyle={item.fontStyle}
              cardStyle={item.cardStyle}
              cardColor={item.cardColor}
              cardColor2={item.cardColor2}
              repostOf={item.repostOf}
              repostCount={item.repostCount}
              repostedByMe={item.repostedByMe}
              reportTargetType={target.kind === 'post' ? 'post' : 'community_post'}
              reportTargetId={target.id}
              onLike={() => (target.kind === 'post' ? likePost.mutate(target.id) : likeCommunityPost.mutate(target.id))}
              onUnlike={() => (target.kind === 'post' ? unlikePost.mutate(target.id) : unlikeCommunityPost.mutate(target.id))}
              onDelete={
                item.userId === me?.id || me?.isAdmin
                  ? () => (item.kind === 'post' ? deletePost.mutate(item.id) : deleteCommunityPost.mutate(item.id))
                  : undefined
              }
              onRepost={
                target.kind === 'post'
                  ? () => repost.mutate(target.id, { onError: (err) => toastError(err, 'Não foi possível repostar.') })
                  : undefined
              }
              onUnrepost={
                target.kind === 'post' && item.myRepostId != null ? () => unrepost.mutate(item.myRepostId!) : undefined
              }
              renderComments={() =>
                target.kind === 'post' ? <PostComments postId={target.id} /> : <CommunityPostComments postId={target.id} />
              }
            />
          )
        })}
      </div>
    </div>
  )
}
