import type { Context } from '@netlify/functions'
import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from './_db'
import { doseLogs } from '../../shared/schema'
import { checkAuth, jsonResponse } from './_auth'
import type { DoseLogInput } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const authError = checkAuth(req)
  if (authError) return authError

  const db = getDb()
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const medicationId = url.searchParams.get('medicationId')

  try {
    if (req.method === 'GET') {
      const conditions = []
      if (from) conditions.push(gte(doseLogs.scheduledFor, new Date(from)))
      if (to) conditions.push(lte(doseLogs.scheduledFor, new Date(to)))
      if (medicationId) conditions.push(eq(doseLogs.medicationId, Number(medicationId)))

      const rows = conditions.length
        ? await db.select().from(doseLogs).where(and(...conditions))
        : await db.select().from(doseLogs)
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as DoseLogInput
      const [row] = await db.insert(doseLogs).values(body).returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'PUT') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const body = (await req.json()) as Partial<DoseLogInput>
      const [row] = await db
        .update(doseLogs)
        .set(body)
        .where(eq(doseLogs.id, Number(id)))
        .returning()
      return jsonResponse(row)
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(doseLogs).where(eq(doseLogs.id, Number(id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('doses function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
