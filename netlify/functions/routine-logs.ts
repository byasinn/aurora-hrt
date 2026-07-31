import type { Context } from '@netlify/functions'
import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { routineLogs } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import type { RoutineLogInput } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  try {
    if (req.method === 'GET') {
      const conditions = [eq(routineLogs.userId, user.id)]
      if (from) conditions.push(gte(routineLogs.date, from))
      if (to) conditions.push(lte(routineLogs.date, to))

      const rows = await db.select().from(routineLogs).where(and(...conditions))
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as RoutineLogInput
      const [row] = await db
        .insert(routineLogs)
        .values({ ...body, userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'PUT') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const body = (await req.json()) as Partial<RoutineLogInput>
      const [row] = await db
        .update(routineLogs)
        .set(body)
        .where(and(eq(routineLogs.id, Number(id)), eq(routineLogs.userId, user.id)))
        .returning()
      return jsonResponse(row)
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(routineLogs).where(and(eq(routineLogs.id, Number(id)), eq(routineLogs.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('routine-logs function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
