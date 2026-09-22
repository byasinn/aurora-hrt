import { Hono } from 'hono'
import { desc, inArray, lt } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { moderationLog, users } from '../../shared/schema'
import { jsonResponse, requireAdmin } from '../shared/auth'
import type { ModerationLogEntryWithDetails } from '../../shared/types'
import type { Env } from '../env'

const PAGE_SIZE = 200

const app = new Hono<{ Bindings: Env }>()

// pagina por cursor (id decrescente, já que a ordenação é por createdAt desc e id cresce junto) —
// sem isso, uma vez passado de 200 ações de moderação no total, as mais antigas somem de vez do
// painel (não tinha jeito nenhum de ver mais antigas).
app.get('/api/admin-moderation-log', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireAdmin(req, db)
  if (auth instanceof Response) return auth

  try {
    const before = Number(new URL(req.url).searchParams.get('before'))

    const rows = await db
      .select()
      .from(moderationLog)
      .where(before ? lt(moderationLog.id, before) : undefined)
      .orderBy(desc(moderationLog.createdAt))
      .limit(PAGE_SIZE)

    const userIds = [...new Set([...rows.map((r) => r.actorId), ...rows.map((r) => r.targetUserId).filter((id): id is number => id != null)])]
    const userRows = userIds.length ? await db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.id, userIds)) : []
    const emailById = new Map(userRows.map((u) => [u.id, u.email]))

    const out: ModerationLogEntryWithDetails[] = rows.map((r) => ({
      ...r,
      actorEmail: emailById.get(r.actorId) ?? '',
      targetEmail: r.targetUserId != null ? (emailById.get(r.targetUserId) ?? null) : null,
    }))
    return jsonResponse({ items: out, nextBefore: rows.length === PAGE_SIZE ? rows[rows.length - 1].id : null })
  } catch (err) {
    console.error('admin-moderation-log error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
