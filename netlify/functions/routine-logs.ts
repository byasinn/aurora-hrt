import type { Context } from '@netlify/functions'
import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { routineLogs } from '../../shared/schema'
import { checkAuth, jsonResponse } from './_shared/auth'
import type { RoutineLogInput } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const authError = checkAuth(req)
  if (authError) return authError

  const db = getDb()
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  try {
    if (req.method === 'GET') {
      const conditions = []
      if (from) conditions.push(gte(routineLogs.date, from))
      if (to) conditions.push(lte(routineLogs.date, to))

      const rows = conditions.length
        ? await db.select().from(routineLogs).where(and(...conditions))
        : await db.select().from(routineLogs)
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as RoutineLogInput
      const [row] = await db.insert(routineLogs).values(body).returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'PUT') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const body = (await req.json()) as Partial<RoutineLogInput>
      const [row] = await db
        .update(routineLogs)
        .set(body)
        .where(eq(routineLogs.id, Number(id)))
        .returning()
      return jsonResponse(row)
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(routineLogs).where(eq(routineLogs.id, Number(id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('routine-logs function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
