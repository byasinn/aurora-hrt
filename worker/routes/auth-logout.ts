import { Hono } from 'hono'
import { getDb } from '../shared/db'
import { clearSessionCookie, deleteSession, jsonResponse } from '../shared/auth'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/auth-logout', async (c) => {
  const req = c.req.raw
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  const cookie = req.headers.get('cookie') ?? ''
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/)
  if (match) {
    const db = getDb(c.env)
    await deleteSession(db, decodeURIComponent(match[1]))
  }

  return jsonResponse({ ok: true }, { headers: { 'set-cookie': clearSessionCookie(c.env) } })
})

export default app
