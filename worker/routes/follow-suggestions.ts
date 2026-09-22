import { Hono } from 'hono'
import { and, eq, inArray, ne, or } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { blocks, follows, profile, topicPageFollows, topicPages } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import type { FollowSuggestion } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()
const MAX_SUGGESTIONS = 12

app.all('/api/follow-suggestions', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const [myTopics, myFollowing, blockRows] = await Promise.all([
      db.select({ topicPageId: topicPageFollows.topicPageId }).from(topicPageFollows).where(eq(topicPageFollows.userId, user.id)),
      db.select({ followingId: follows.followingId }).from(follows).where(eq(follows.followerId, user.id)),
      db.select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId }).from(blocks).where(or(eq(blocks.blockerId, user.id), eq(blocks.blockedId, user.id))),
    ])
    const myTopicIds = myTopics.map((t) => t.topicPageId)
    const excludeIds = new Set([user.id, ...myFollowing.map((f) => f.followingId)])
    for (const b of blockRows) excludeIds.add(b.blockerId === user.id ? b.blockedId : b.blockerId)

    // sinal 1 (principal): quem segue os mesmos tópicos de interesse que eu — é o "grafo de
    // interesses" pedido, junta gente com gosto parecido mesmo sem nenhuma conexão social prévia.
    const bySharedTopic = new Map<number, { count: number; topicNames: Set<string> }>()
    if (myTopicIds.length > 0) {
      const rows = await db
        .select({ userId: topicPageFollows.userId, topicName: topicPages.name })
        .from(topicPageFollows)
        .innerJoin(topicPages, eq(topicPages.id, topicPageFollows.topicPageId))
        .where(inArray(topicPageFollows.topicPageId, myTopicIds))
      for (const r of rows) {
        if (excludeIds.has(r.userId)) continue
        const entry = bySharedTopic.get(r.userId) ?? { count: 0, topicNames: new Set<string>() }
        entry.count++
        entry.topicNames.add(r.topicName)
        bySharedTopic.set(r.userId, entry)
      }
    }

    // sinal 2 (complemento): "amigos de amigos" — quem as pessoas que eu sigo também seguem.
    // Cobre quem ainda não seguiu nenhum tópico, pra sugestão não ficar vazia logo de cara.
    const friendsOfFriends = new Map<number, number>()
    if (myFollowing.length > 0) {
      const rows = await db
        .select({ userId: follows.followingId })
        .from(follows)
        .where(and(inArray(follows.followerId, myFollowing.map((f) => f.followingId)), eq(follows.status, 'accepted')))
      for (const r of rows) {
        if (excludeIds.has(r.userId) || bySharedTopic.has(r.userId)) continue
        friendsOfFriends.set(r.userId, (friendsOfFriends.get(r.userId) ?? 0) + 1)
      }
    }

    const candidateIds = [
      ...[...bySharedTopic.entries()].sort((a, b) => b[1].count - a[1].count).map(([id]) => id),
      ...[...friendsOfFriends.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id),
    ].slice(0, MAX_SUGGESTIONS)

    if (candidateIds.length === 0) return jsonResponse([])

    const profiles = await db.select().from(profile).where(and(inArray(profile.userId, candidateIds), ne(profile.isPrivate, true)))
    const profileById = new Map(profiles.map((p) => [p.userId, p]))

    const out: FollowSuggestion[] = candidateIds
      .map((id) => {
        const p = profileById.get(id)
        if (!p) return null // privada ou perfil ainda não criado — não sugere
        const shared = bySharedTopic.get(id)
        return {
          userId: id,
          username: p.username ?? '',
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          avatarIcon: p.avatarIcon,
          pronouns: p.pronouns,
          isVerified: p.isVerified,
          sharedTopics: shared ? [...shared.topicNames].slice(0, 2) : [],
        } satisfies FollowSuggestion
      })
      .filter((s): s is FollowSuggestion => s != null)

    return jsonResponse(out)
  } catch (err) {
    console.error('follow-suggestions route error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
