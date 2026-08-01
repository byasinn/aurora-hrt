import type { Context } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { users } from '../../shared/schema'
import { jsonResponse, requireAdmin } from './_shared/auth'
import type { AdminUserSummary } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireAdmin(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    if (req.method === 'GET') {
      const rows: AdminUserSummary[] = await db
        .select({
          id: users.id,
          email: users.email,
          emailVerified: users.emailVerified,
          isAdmin: users.isAdmin,
          banned: users.banned,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(users.createdAt)
      return jsonResponse(rows)
    }

    if (req.method === 'PUT') {
      const id = Number(new URL(req.url).searchParams.get('id'))
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      if (id === user.id) return jsonResponse({ error: 'não é possível banir a própria conta' }, { status: 400 })

      const { banned } = (await req.json()) as { banned?: boolean }
      if (typeof banned !== 'boolean') return jsonResponse({ error: 'banned é obrigatório' }, { status: 400 })

      const [row] = await db.update(users).set({ banned }).where(eq(users.id, id)).returning({
        id: users.id,
        email: users.email,
        emailVerified: users.emailVerified,
        isAdmin: users.isAdmin,
        banned: users.banned,
        createdAt: users.createdAt,
      })
      if (!row) return jsonResponse({ error: 'usuário não encontrado' }, { status: 404 })
      return jsonResponse(row)
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('admin-users function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
