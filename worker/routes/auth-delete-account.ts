import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { users } from '../../shared/schema'
import { clearSessionCookie, jsonResponse, requireUser } from '../shared/auth'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/auth-delete-account', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  if (req.method !== 'DELETE') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    // Cascade cuida de apagar profile, medicamentos, doses, humor, medidas, exames,
    // posts, rotinas, mensagens, follows, likes, comentários, sessões etc.
    await db.delete(users).where(eq(users.id, user.id))
    return jsonResponse({ ok: true }, { headers: { 'set-cookie': clearSessionCookie(c.env) } })
  } catch (err) {
    console.error('auth-delete-account error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
