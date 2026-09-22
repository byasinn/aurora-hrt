import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { users } from '../../shared/schema'
import { jsonResponse, secretEquals } from '../shared/auth'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

/**
 * Promove um usuário a admin — protegido por BOOTSTRAP_SECRET (não por sessão),
 * porque existe justamente pra criar o PRIMEIRO admin, antes de qualquer conta
 * já ser admin. Só funciona enquanto nenhum admin existir — depois disso, promover
 * alguém é feito pelo próprio painel de admin (requer já ser admin).
 */
app.all('/api/admin-bootstrap', async (c) => {
  const req = c.req.raw
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  const secret = c.env.BOOTSTRAP_SECRET
  if (!secret) return jsonResponse({ error: 'BOOTSTRAP_SECRET não configurada' }, { status: 500 })
  const provided = req.headers.get('x-bootstrap-secret')
  if (!provided || !secretEquals(provided, secret)) {
    return jsonResponse({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const db = getDb(c.env)
    const [existingAdmin] = await db.select({ id: users.id }).from(users).where(eq(users.isAdmin, true)).limit(1)
    if (existingAdmin) {
      return jsonResponse({ error: 'já existe um admin — use o painel de admin pra promover outras contas' }, { status: 403 })
    }

    const { email } = (await req.json()) as { email?: string }
    if (!email) return jsonResponse({ error: 'email é obrigatório' }, { status: 400 })

    const [row] = await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.email, email.trim().toLowerCase()))
      .returning({ id: users.id, email: users.email, isAdmin: users.isAdmin })

    if (!row) return jsonResponse({ error: 'usuário não encontrado' }, { status: 404 })
    return jsonResponse(row)
  } catch (err) {
    console.error('admin-bootstrap error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
