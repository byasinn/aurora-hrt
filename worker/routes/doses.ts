import { Hono } from 'hono'
import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { doseLogs, medications } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { stripOwnerFields } from '../shared/contentLimits'
import type { DoseLogInput } from '../../shared/types'
import type { Env } from '../env'

function coerceDates<T extends Record<string, unknown>>(body: T): T {
  const out = { ...body }
  for (const key of ['scheduledFor', 'takenAt'] as const) {
    const value = out[key]
    if (typeof value === 'string') (out as Record<string, unknown>)[key] = new Date(value)
  }
  return out
}

const app = new Hono<{ Bindings: Env }>()

app.all('/api/doses', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const medicationId = url.searchParams.get('medicationId')

  try {
    if (req.method === 'GET') {
      const conditions = [eq(doseLogs.userId, user.id)]
      if (from) conditions.push(gte(doseLogs.scheduledFor, new Date(from)))
      if (to) conditions.push(lte(doseLogs.scheduledFor, new Date(to)))
      if (medicationId) conditions.push(eq(doseLogs.medicationId, Number(medicationId)))

      const rows = await db.select().from(doseLogs).where(and(...conditions))
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = coerceDates((await req.json()) as DoseLogInput)
      if (body.medicationId != null) {
        const [med] = await db
          .select({ id: medications.id })
          .from(medications)
          .where(and(eq(medications.id, body.medicationId), eq(medications.userId, user.id)))
          .limit(1)
        if (!med) return jsonResponse({ error: 'medicamento não encontrado' }, { status: 404 })
      }
      const [row] = await db
        .insert(doseLogs)
        .values({ ...body, userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'PUT') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const body = coerceDates((await req.json()) as Partial<DoseLogInput>)
      if (body.medicationId != null) {
        const [med] = await db
          .select({ id: medications.id })
          .from(medications)
          .where(and(eq(medications.id, body.medicationId), eq(medications.userId, user.id)))
          .limit(1)
        if (!med) return jsonResponse({ error: 'medicamento não encontrado' }, { status: 404 })
      }
      const [row] = await db
        .update(doseLogs)
        .set(stripOwnerFields(body))
        .where(and(eq(doseLogs.id, Number(id)), eq(doseLogs.userId, user.id)))
        .returning()
      return jsonResponse(row)
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(doseLogs).where(and(eq(doseLogs.id, Number(id)), eq(doseLogs.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('doses function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
