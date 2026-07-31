import type { Context } from '@netlify/functions'
import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { labResults } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import type { LabResultInput } from '../../shared/types'

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
      const conditions = [eq(labResults.userId, user.id)]
      if (type) conditions.push(eq(labResults.type, type))
      if (from) conditions.push(gte(labResults.date, from))
      if (to) conditions.push(lte(labResults.date, to))

      const rows = await db.select().from(labResults).where(and(...conditions))
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as LabResultInput
      const [row] = await db
        .insert(labResults)
        .values({ ...body, userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(labResults).where(and(eq(labResults.id, Number(id)), eq(labResults.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('labs function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
