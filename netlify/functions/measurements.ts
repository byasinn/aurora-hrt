import type { Context } from '@netlify/functions'
import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { measurements } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import type { MeasurementInput } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const type = url.searchParams.get('type')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  try {
    if (req.method === 'GET') {
      const conditions = [eq(measurements.userId, user.id)]
      if (type) conditions.push(eq(measurements.type, type))
      if (from) conditions.push(gte(measurements.date, from))
      if (to) conditions.push(lte(measurements.date, to))

      const rows = await db.select().from(measurements).where(and(...conditions))
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as MeasurementInput
      const [row] = await db
        .insert(measurements)
        .values({ ...body, userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(measurements).where(and(eq(measurements.id, Number(id)), eq(measurements.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('measurements function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
