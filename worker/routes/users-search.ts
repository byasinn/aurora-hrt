import { Hono } from 'hono'
import { and, eq, ilike, isNotNull, ne, notInArray, or } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { profile, follows, blocks } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import type { PublicUserSummary } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/users-search', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  const q = (new URL(req.url).searchParams.get('q')?.trim() ?? '').replace(/^@/, '')
  if (!q) return jsonResponse([])

  try {
    // bloqueio em qualquer direção não pode aparecer na busca — bloquear alguém não adianta nada
    // se a pessoa continua te achando pelo nome.
    const blockRows = await db
      .select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId })
      .from(blocks)
      .where(or(eq(blocks.blockerId, user.id), eq(blocks.blockedId, user.id)))
    const blockedIds = [...new Set(blockRows.map((b) => (b.blockerId === user.id ? b.blockedId : b.blockerId)))]

    const rows = await db
      .select({
        userId: profile.userId,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        avatarIcon: profile.avatarIcon,
        pronouns: profile.pronouns,
        isVerified: profile.isVerified,
      })
      .from(profile)
      .where(
        and(
          or(ilike(profile.displayName, `%${q}%`), ilike(profile.username, `%${q}%`)),
          isNotNull(profile.userId),
          ne(profile.userId, user.id),
          blockedIds.length ? notInArray(profile.userId, blockedIds) : undefined,
        ),
      )
      .limit(20)

    const myFollowing = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(and(eq(follows.followerId, user.id), eq(follows.status, 'accepted')))
    const followingSet = new Set(myFollowing.map((f) => f.followingId))

    const results: PublicUserSummary[] = rows.map((r) => ({
      userId: r.userId!,
      username: r.username ?? '',
      displayName: r.displayName,
      avatarUrl: r.avatarUrl,
      avatarIcon: r.avatarIcon,
      pronouns: r.pronouns,
      isFollowedByMe: followingSet.has(r.userId!),
      isVerified: r.isVerified,
    }))

    return jsonResponse(results)
  } catch (err) {
    console.error('users-search function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
