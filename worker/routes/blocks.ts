import { Hono } from 'hono'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { blocks, follows, users, profile } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import type { BlockedUserSummary } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/blocks', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    if (req.method === 'GET') {
      const rows = await db.select().from(blocks).where(eq(blocks.blockerId, user.id))
      if (rows.length === 0) return jsonResponse([])

      const blockedIds = rows.map((r) => r.blockedId)
      const profiles = await db.select().from(profile).where(inArray(profile.userId, blockedIds))
      const profileById = new Map(profiles.map((p) => [p.userId, p]))

      const out: BlockedUserSummary[] = blockedIds.map((id) => {
        const p = profileById.get(id)
        return {
          userId: id,
          username: p?.username ?? '',
          displayName: p?.displayName ?? '',
          avatarUrl: p?.avatarUrl ?? null,
          avatarIcon: p?.avatarIcon ?? null,
        }
      })
      return jsonResponse(out)
    }

    if (req.method === 'POST') {
      const { userId: blockedId } = (await req.json()) as { userId?: number }
      if (!blockedId || blockedId === user.id) {
        return jsonResponse({ error: 'userId inválido' }, { status: 400 })
      }
      const [target] = await db.select().from(users).where(eq(users.id, blockedId)).limit(1)
      if (!target) return jsonResponse({ error: 'usuário não encontrado' }, { status: 404 })

      await db.insert(blocks).values({ blockerId: user.id, blockedId }).onConflictDoNothing()

      // bloquear desfaz qualquer follow nos dois sentidos
      await db
        .delete(follows)
        .where(
          and(eq(follows.followerId, user.id), eq(follows.followingId, blockedId)),
        )
      await db
        .delete(follows)
        .where(
          and(eq(follows.followerId, blockedId), eq(follows.followingId, user.id)),
        )

      return jsonResponse({ ok: true }, { status: 201 })
    }

    if (req.method === 'DELETE') {
      const blockedId = Number(new URL(req.url).searchParams.get('userId'))
      if (!blockedId) return jsonResponse({ error: 'userId é obrigatório' }, { status: 400 })
      await db.delete(blocks).where(and(eq(blocks.blockerId, user.id), eq(blocks.blockedId, blockedId)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('blocks function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
