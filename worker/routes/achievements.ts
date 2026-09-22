import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { unlockedAchievements } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { computeServerPointsStats } from '../shared/pointsStats'
import { ACHIEVEMENTS_SFW } from '../../src/lib/collectiblesEngine'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/achievements', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    if (req.method === 'GET') {
      const rows = await db.select().from(unlockedAchievements).where(eq(unlockedAchievements.userId, user.id))
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const { key } = (await req.json()) as { key: string }
      if (!key) return jsonResponse({ error: 'key é obrigatório' }, { status: 400 })

      const [existing] = await db
        .select()
        .from(unlockedAchievements)
        .where(and(eq(unlockedAchievements.achievementKey, key), eq(unlockedAchievements.userId, user.id)))
      if (existing) return jsonResponse(existing)

      const achievement = ACHIEVEMENTS_SFW.find((a) => a.key === key)
      if (!achievement) return jsonResponse({ error: 'conquista desconhecida' }, { status: 400 })
      const stats = await computeServerPointsStats(db, user.id)
      if (!achievement.isMet(stats)) return jsonResponse({ error: 'condição da conquista ainda não atingida' }, { status: 403 })

      const [row] = await db
        .insert(unlockedAchievements)
        .values({ achievementKey: key, userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('achievements function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
