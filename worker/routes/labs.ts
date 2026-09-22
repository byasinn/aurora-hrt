import { Hono } from 'hono'
import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { labResults } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { validateText, validateDateStr, validateFloatRange } from '../shared/contentLimits'
import type { LabResultInput } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/labs', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
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
      if (!body.type?.trim()) return jsonResponse({ error: 'type é obrigatório' }, { status: 400 })
      if (!body.unit?.trim()) return jsonResponse({ error: 'unit é obrigatório' }, { status: 400 })
      if (!body.date) return jsonResponse({ error: 'date é obrigatório' }, { status: 400 })
      const dateError = validateDateStr(body.date)
      if (dateError) return jsonResponse({ error: dateError }, { status: 400 })
      const valueError = validateFloatRange(body.value, 0, 1_000_000, 'value')
      if (valueError) return jsonResponse({ error: valueError }, { status: 400 })
      const typeError = validateText(body.type, 60)
      if (typeError) return jsonResponse({ error: typeError }, { status: 400 })
      const labelError = validateText(body.label, 60)
      if (labelError) return jsonResponse({ error: labelError }, { status: 400 })
      const unitError = validateText(body.unit, 30)
      if (unitError) return jsonResponse({ error: unitError }, { status: 400 })
      const notesError = validateText(body.notes, 1000)
      if (notesError) return jsonResponse({ error: notesError }, { status: 400 })

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
})

export default app
