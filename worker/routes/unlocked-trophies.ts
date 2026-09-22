import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { unlockedTrophies } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { computeServerPointsStats } from '../shared/pointsStats'
import { TROPHIES_SFW } from '../../src/lib/collectiblesEngine'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/unlocked-trophies', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    if (req.method === 'GET') {
      const rows = await db.select().from(unlockedTrophies).where(eq(unlockedTrophies.userId, user.id))
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const { key } = (await req.json()) as { key?: string }
      if (!key) return jsonResponse({ error: 'key é obrigatório' }, { status: 400 })

      const [existing] = await db
        .select()
        .from(unlockedTrophies)
        .where(and(eq(unlockedTrophies.trophyKey, key), eq(unlockedTrophies.userId, user.id)))
      if (existing) return jsonResponse(existing)

      const trophy = TROPHIES_SFW.find((t) => t.key === key)
      if (!trophy) return jsonResponse({ error: 'troféu desconhecido' }, { status: 400 })
      const stats = await computeServerPointsStats(db, user.id)
      if (!trophy.isMet(stats)) return jsonResponse({ error: 'condição do troféu ainda não atingida' }, { status: 403 })

      const [row] = await db
        .insert(unlockedTrophies)
        .values({ trophyKey: key, userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('unlocked-trophies function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
