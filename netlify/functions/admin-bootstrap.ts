import type { Context } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { users } from '../../shared/schema'
import { jsonResponse } from './_shared/auth'

/**
 * Promove um usuário a admin — protegido por BOOTSTRAP_SECRET (não por sessão),
 * porque existe justamente pra criar o PRIMEIRO admin, antes de qualquer conta
 * já ser admin. Sem BOOTSTRAP_SECRET configurada, a rota fica desligada.
 */
export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  const secret = process.env.BOOTSTRAP_SECRET
  if (!secret) return jsonResponse({ error: 'BOOTSTRAP_SECRET não configurada' }, { status: 500 })
  if (req.headers.get('x-bootstrap-secret') !== secret) {
    return jsonResponse({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const { email } = (await req.json()) as { email?: string }
    if (!email) return jsonResponse({ error: 'email é obrigatório' }, { status: 400 })

    const db = getDb()
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
}
