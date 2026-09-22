import { Hono } from 'hono'
import { getDb } from '../shared/db'
import { jsonResponse, requireUser } from '../shared/auth'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/vapid-public-key', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  const publicKey = c.env.VAPID_PUBLIC_KEY
  if (!publicKey) return jsonResponse({ error: 'VAPID_PUBLIC_KEY não configurada' }, { status: 500 })
  return jsonResponse({ publicKey })
})

export default app
