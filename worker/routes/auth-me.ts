import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { users } from '../../shared/schema'
import { getSessionUser, jsonResponse } from '../shared/auth'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/auth-me', async (c) => {
  const req = c.req.raw
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  const db = getDb(c.env)
  const user = await getSessionUser(req, db)
  if (!user) return jsonResponse({ error: 'unauthorized' }, { status: 401 })
  // a tela de Conta precisa saber se a conta tem senha (quem entrou só com Google cria uma, em vez de trocar)
  const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1)
  return jsonResponse({ ...user, hasPassword: !!row?.passwordHash })
})

export default app
