import { Hono } from 'hono'
import { getDb } from '../shared/db'
import { getSessionUser, jsonResponse } from '../shared/auth'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/auth-me', async (c) => {
  const req = c.req.raw
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  const db = getDb(c.env)
  const user = await getSessionUser(req, db)
  if (!user) return jsonResponse({ error: 'unauthorized' }, { status: 401 })
  return jsonResponse(user)
})

export default app
