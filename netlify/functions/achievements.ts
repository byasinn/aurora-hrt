import type { Context } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { getDb } from './_db'
import { unlockedAchievements } from '../../shared/schema'
import { checkAuth, jsonResponse } from './_auth'

export default async (req: Request, _context: Context) => {
  const authError = checkAuth(req)
  if (authError) return authError

  const db = getDb()

  try {
    if (req.method === 'GET') {
      const rows = await db.select().from(unlockedAchievements)
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const { key } = (await req.json()) as { key: string }
      if (!key) return jsonResponse({ error: 'key é obrigatório' }, { status: 400 })

      const [existing] = await db
        .select()
        .from(unlockedAchievements)
        .where(eq(unlockedAchievements.achievementKey, key))
      if (existing) return jsonResponse(existing)

      const [row] = await db
        .insert(unlockedAchievements)
        .values({ achievementKey: key })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('achievements function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
