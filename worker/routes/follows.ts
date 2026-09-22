import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { follows, users, profile } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { hasBlockRelation } from '../shared/blocks'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/follows', async (c) => {
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
        .where(and(eq(follows.followerId, user.id), eq(follows.status, 'accepted')))
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const { followingId } = (await req.json()) as { followingId?: number }
      if (!followingId || followingId === user.id) {
        return jsonResponse({ error: 'followingId inválido' }, { status: 400 })
      }
      const [target] = await db.select().from(users).where(eq(users.id, followingId)).limit(1)
      if (!target) return jsonResponse({ error: 'usuário não encontrado' }, { status: 404 })

      if (await hasBlockRelation(db, user.id, followingId)) {
        return jsonResponse({ error: 'não é possível seguir essa conta' }, { status: 403 })
      }

      const [targetProfile] = await db.select({ isPrivate: profile.isPrivate }).from(profile).where(eq(profile.userId, followingId)).limit(1)
      const status = targetProfile?.isPrivate ? 'pending' : 'accepted'

      const [row] = await db
        .insert(follows)
        .values({ followerId: user.id, followingId, status })
        .onConflictDoNothing()
        .returning()
      return jsonResponse(row ?? { followerId: user.id, followingId, status }, { status: 201 })
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url)
      const followingId = Number(url.searchParams.get('followingId'))
      const removeFollowerId = Number(url.searchParams.get('removeFollowerId'))

      if (followingId) {
        // deixar de seguir alguém
        await db.delete(follows).where(and(eq(follows.followerId, user.id), eq(follows.followingId, followingId)))
        return jsonResponse({ ok: true })
      }
      if (removeFollowerId) {
        // remover alguém que me segue
        await db.delete(follows).where(and(eq(follows.followerId, removeFollowerId), eq(follows.followingId, user.id)))
        return jsonResponse({ ok: true })
      }
      return jsonResponse({ error: 'followingId ou removeFollowerId é obrigatório' }, { status: 400 })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('follows function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
