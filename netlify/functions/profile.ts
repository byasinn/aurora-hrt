import type { Context } from '@netlify/functions'
import { and, eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { profile } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import type { ProfileInput } from '../../shared/types'

async function getOrCreateProfile(db: ReturnType<typeof getDb>, userId: number) {
  const [existing] = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1)
  if (existing) return existing
  const [created] = await db.insert(profile).values({ userId }).returning()
  return created
}

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    if (req.method === 'GET') {
      const row = await getOrCreateProfile(db, user.id)
      return jsonResponse(row)
    }

    if (req.method === 'PUT') {
      const current = await getOrCreateProfile(db, user.id)
      const body = (await req.json()) as ProfileInput
      const [row] = await db
        .update(profile)
        .set(body)
        .where(and(eq(profile.id, current.id), eq(profile.userId, user.id)))
        .returning()
      return jsonResponse(row)
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('profile function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
