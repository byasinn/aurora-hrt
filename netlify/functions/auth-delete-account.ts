import type { Context } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { users } from '../../shared/schema'
import { clearSessionCookie, jsonResponse, requireUser } from './_shared/auth'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  if (req.method !== 'DELETE') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    // Cascade cuida de apagar profile, medicamentos, doses, humor, medidas, exames,
    // posts, rotinas, mensagens, follows, likes, comentários, sessões etc.
    await db.delete(users).where(eq(users.id, user.id))
    return jsonResponse({ ok: true }, { headers: { 'set-cookie': clearSessionCookie() } })
  } catch (err) {
    console.error('auth-delete-account error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
