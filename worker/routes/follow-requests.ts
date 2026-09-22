import { Hono } from 'hono'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { follows, profile } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import type { PublicUserSummary } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/follow-requests', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    if (req.method === 'GET') {
      const rows = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followingId, user.id), eq(follows.status, 'pending')))
        .orderBy(follows.createdAt)
      if (rows.length === 0) return jsonResponse([])

      const requesterIds = rows.map((r) => r.followerId)
      const profiles = await db.select().from(profile).where(inArray(profile.userId, requesterIds))
      const profileById = new Map(profiles.map((p) => [p.userId, p]))

      const out: PublicUserSummary[] = rows.map((r) => {
        const p = profileById.get(r.followerId)
        return {
          userId: r.followerId,
          username: p?.username ?? '',
          displayName: p?.displayName ?? '',
          avatarUrl: p?.avatarUrl ?? null,
          avatarIcon: p?.avatarIcon ?? null,
          pronouns: p?.pronouns ?? '',
          isFollowedByMe: false,
          isVerified: p?.isVerified ?? false,
        }
      })
      return jsonResponse(out)
    }

    if (req.method === 'PUT') {
      const followerId = Number(new URL(req.url).searchParams.get('followerId'))
      if (!followerId) return jsonResponse({ error: 'followerId é obrigatório' }, { status: 400 })
      const [row] = await db
        .update(follows)
        .set({ status: 'accepted' })
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, user.id), eq(follows.status, 'pending')))
        .returning()
      if (!row) return jsonResponse({ error: 'pedido não encontrado' }, { status: 404 })
      return jsonResponse(row)
    }

    if (req.method === 'DELETE') {
      const followerId = Number(new URL(req.url).searchParams.get('followerId'))
      if (!followerId) return jsonResponse({ error: 'followerId é obrigatório' }, { status: 400 })
      await db
        .delete(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, user.id), eq(follows.status, 'pending')))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('follow-requests function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
