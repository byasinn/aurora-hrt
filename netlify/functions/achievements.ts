import type { Context } from '@netlify/functions'
import { and, eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { unlockedAchievements } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'

export default async (req: Request, _context: Context) => {
  const db = getDb()
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
}
