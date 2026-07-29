import type { Context } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { profile } from '../../shared/schema'
import { checkAuth, jsonResponse } from './_shared/auth'
import type { ProfileInput } from '../../shared/types'

// App de uso pessoal (single-user): sempre lemos/criamos a única linha de perfil.
async function getOrCreateProfile(db: ReturnType<typeof getDb>) {
  const [existing] = await db.select().from(profile).limit(1)
  if (existing) return existing
  const [created] = await db.insert(profile).values({}).returning()
  return created
}

export default async (req: Request, _context: Context) => {
  const authError = checkAuth(req)
  if (authError) return authError

  const db = getDb()

  try {
    if (req.method === 'GET') {
      const row = await getOrCreateProfile(db)
      return jsonResponse(row)
    }

    if (req.method === 'PUT') {
      const current = await getOrCreateProfile(db)
      const body = (await req.json()) as ProfileInput
      const [row] = await db
        .update(profile)
        .set(body)
        .where(eq(profile.id, current.id))
        .returning()
      return jsonResponse(row)
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('profile function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
