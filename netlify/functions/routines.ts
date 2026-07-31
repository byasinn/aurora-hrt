import type { Context } from '@netlify/functions'
import { and, eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { routines } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import type { RoutineInput } from '../../shared/types'

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
        .from(routines)
        .where(eq(routines.userId, user.id))
        .orderBy(routines.createdAt)
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as RoutineInput
      const [row] = await db
        .insert(routines)
        .values({ ...body, userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'PUT') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const body = (await req.json()) as Partial<RoutineInput>
      const [row] = await db
        .update(routines)
        .set(body)
        .where(and(eq(routines.id, Number(id)), eq(routines.userId, user.id)))
        .returning()
      return jsonResponse(row)
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(routines).where(and(eq(routines.id, Number(id)), eq(routines.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('routines function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
