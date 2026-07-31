import type { Context } from '@netlify/functions'
import { and, desc, eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { posts } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import type { PostInput } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  try {
    if (req.method === 'GET') {
      const rows = await db
        .select()
        .from(posts)
        .where(eq(posts.userId, user.id))
        .orderBy(desc(posts.createdAt))
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as PostInput
      const [row] = await db
        .insert(posts)
        .values({ ...body, userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(posts).where(and(eq(posts.id, Number(id)), eq(posts.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('posts function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
