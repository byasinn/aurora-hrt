import { Hono } from 'hono'
import { and, desc, eq, inArray, notInArray, or } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { blocks, communities, communityMembers, communityPosts, follows, posts, profile } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { enrichPosts } from '../shared/social'
import { enrichCommunityPosts } from '../shared/community'
import type { FeedItem, RepostOriginal } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

// quantos posts de gente que a pessoa NÃO segue entram no feed pra descoberta — só perfis públicos,
// sempre os mais recentes (a query roda do zero a cada load do feed, então isso já fica "atualizado"
// sozinho sem precisar de nenhum cache/job à parte).
const DISCOVERY_LIMIT = 12

app.all('/api/feed', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const [myFollowing, myCommunities, blockRows] = await Promise.all([
      // só 'accepted' — um pedido de seguir ainda pendente pra conta privada não pode trazer os
      // posts dela pro feed antes de ser aprovado.
      db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(and(eq(follows.followerId, user.id), eq(follows.status, 'accepted'))),
      db.select({ communityId: communityMembers.communityId }).from(communityMembers).where(eq(communityMembers.userId, user.id)),
      db
        .select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId })
        .from(blocks)
        .where(or(eq(blocks.blockerId, user.id), eq(blocks.blockedId, user.id))),
    ])

    const authorIds = [...new Set([user.id, ...myFollowing.map((f) => f.followingId)])]
    const communityIds = myCommunities.map((c) => c.communityId)
    const blockedUserIds = blockRows.map((b) => (b.blockerId === user.id ? b.blockedId : b.blockerId))
    // ninguém bloqueado (nos dois sentidos) entra na descoberta, mesmo sendo perfil público
    const excludedFromDiscovery = [...new Set([...authorIds, ...blockedUserIds])]

    const [rawPosts, rawCommunityPosts, discoveryRows] = await Promise.all([
      db.select().from(posts).where(inArray(posts.userId, authorIds)).orderBy(desc(posts.createdAt)).limit(50),
      communityIds.length
        ? db
            .select()
            .from(communityPosts)
            .where(inArray(communityPosts.communityId, communityIds))
            .orderBy(desc(communityPosts.createdAt))
            .limit(50)
        : Promise.resolve([]),
      // descoberta: posts de quem a pessoa não segue ainda, só perfil público — pra quem segue
      // pouca gente (ou ninguém) não ficar com o feed vazio.
      db
        .select({ post: posts })
        .from(posts)
        .innerJoin(profile, eq(profile.userId, posts.userId))
        .where(and(eq(profile.isPrivate, false), notInArray(posts.userId, excludedFromDiscovery)))
        .orderBy(desc(posts.createdAt))
        .limit(DISCOVERY_LIMIT),
    ])

    const rawPostsWithDiscovery = [...rawPosts, ...discoveryRows.map((r) => r.post)]

    // reposts vivem na tabela posts também (repostOfKind/repostOfId apontando pro original) — só reposts
    // de posts pessoais são permitidos (não de comunidade, pra não vazar conteúdo restrito a membro).
    const repostRows = rawPostsWithDiscovery.filter((p) => p.repostOfKind === 'post' && p.repostOfId != null)
    const originalIds = [...new Set(repostRows.map((r) => r.repostOfId!))]

    const [enrichedPosts, enrichedCommunityPosts, communityRows, originalRows] = await Promise.all([
      enrichPosts(db, rawPostsWithDiscovery, user.id),
      enrichCommunityPosts(db, rawCommunityPosts, user.id),
      communityIds.length ? db.select().from(communities).where(inArray(communities.id, communityIds)) : Promise.resolve([]),
      originalIds.length ? db.select().from(posts).where(inArray(posts.id, originalIds)) : Promise.resolve([]),
    ])
    const communityNameById = new Map(communityRows.map((c) => [c.id, c.name]))
    const enrichedOriginals = await enrichPosts(db, originalRows, user.id)
    const originalById = new Map(enrichedOriginals.map((p) => [p.id, p]))

    // contagem de reposts + "eu já repostei" — olha qualquer post original que aparece direto no feed
    // OU que é alvo de um repost que aparece no feed.
    const candidatePostIds = [...new Set([...rawPostsWithDiscovery.filter((p) => !p.repostOfKind).map((p) => p.id), ...originalIds])]
    const repostRowsForCounting = candidatePostIds.length
      ? await db
          .select({ id: posts.id, repostOfId: posts.repostOfId, userId: posts.userId })
          .from(posts)
          .where(and(eq(posts.repostOfKind, 'post'), inArray(posts.repostOfId, candidatePostIds)))
      : []
    const repostCountByOriginal = new Map<number, number>()
    const repostedByMeSet = new Set<number>()
    const myRepostIdByOriginal = new Map<number, number>()
    for (const r of repostRowsForCounting) {
      if (r.repostOfId == null) continue
      repostCountByOriginal.set(r.repostOfId, (repostCountByOriginal.get(r.repostOfId) ?? 0) + 1)
      if (r.userId === user.id) {
        repostedByMeSet.add(r.repostOfId)
        myRepostIdByOriginal.set(r.repostOfId, r.id)
      }
    }

    const postItems: FeedItem[] = enrichedPosts.flatMap((p): FeedItem[] => {
      if (p.repostOfKind === 'post' && p.repostOfId != null) {
        const original = originalById.get(p.repostOfId)
        if (!original) return [] // original apagado — não mostra o repost órfão
        const repostOf: RepostOriginal = {
          kind: 'post',
          id: original.id,
          author: original.author,
          text: original.text,
          images: original.images,
          communityName: null,
          fontStyle: original.fontStyle,
          cardStyle: original.cardStyle,
          cardColor: original.cardColor,
          cardColor2: original.cardColor2,
        }
        return [
          {
            kind: 'post' as const,
            id: p.id,
            userId: p.userId,
            text: null,
            images: [],
            createdAt: p.createdAt,
            author: p.author,
            likeCount: original.likeCount,
            commentCount: original.commentCount,
            likedByMe: original.likedByMe,
            communityId: null,
            communityName: null,
            fontStyle: original.fontStyle,
            cardStyle: original.cardStyle,
            cardColor: original.cardColor,
            cardColor2: original.cardColor2,
            repostOf,
            repostCount: repostCountByOriginal.get(original.id) ?? 0,
            repostedByMe: repostedByMeSet.has(original.id),
            myRepostId: myRepostIdByOriginal.get(original.id) ?? null,
          },
        ]
      }
      return [
        {
          ...p,
          kind: 'post' as const,
          communityId: null,
          communityName: null,
          repostOf: null,
          repostCount: repostCountByOriginal.get(p.id) ?? 0,
          repostedByMe: repostedByMeSet.has(p.id),
          myRepostId: myRepostIdByOriginal.get(p.id) ?? null,
        },
      ]
    })

    const items: FeedItem[] = [
      ...postItems,
      ...enrichedCommunityPosts.map((p) => ({
        ...p,
        kind: 'community' as const,
        communityId: p.communityId,
        communityName: communityNameById.get(p.communityId) ?? null,
        repostOf: null,
        repostCount: 0,
        repostedByMe: false,
        myRepostId: null,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50)

    return jsonResponse(items)
  } catch (err) {
    console.error('feed function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
