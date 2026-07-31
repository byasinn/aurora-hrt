import type { Context } from '@netlify/functions'
import { and, eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { follows, users } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    if (req.method === 'GET') {
      const rows = await db.select().from(follows).where(eq(follows.followerId, user.id))
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const { followingId } = (await req.json()) as { followingId?: number }
      if (!followingId || followingId === user.id) {
        return jsonResponse({ error: 'followingId inválido' }, { status: 400 })
      }
      const [target] = await db.select().from(users).where(eq(users.id, followingId)).limit(1)
      if (!target) return jsonResponse({ error: 'usuário não encontrado' }, { status: 404 })

      const [row] = await db
        .insert(follows)
        .values({ followerId: user.id, followingId })
        .onConflictDoNothing()
        .returning()
      return jsonResponse(row ?? { followerId: user.id, followingId }, { status: 201 })
    }

    if (req.method === 'DELETE') {
      const followingId = Number(new URL(req.url).searchParams.get('followingId'))
      if (!followingId) return jsonResponse({ error: 'followingId é obrigatório' }, { status: 400 })
      await db.delete(follows).where(and(eq(follows.followerId, user.id), eq(follows.followingId, followingId)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('follows function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
