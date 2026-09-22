import { Hono } from 'hono'
import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { intimateLogs } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { validateText, validateDateStr, validateEnum, validateEnumArray } from '../shared/contentLimits'
import type { IntimateLogInput } from '../../shared/types'
import type { Env } from '../env'

const TYPE_OPTIONS = ['solo', 'partner', 'toy'] as const
const PENETRATION_OPTIONS = ['none', 'vaginal', 'anal'] as const
const PAIN_OPTIONS = ['none', 'light', 'strong'] as const

const app = new Hono<{ Bindings: Env }>()

app.all('/api/intimate-logs', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  try {
    if (req.method === 'GET') {
      const conditions = [eq(intimateLogs.userId, user.id)]
      if (from) conditions.push(gte(intimateLogs.date, from))
      if (to) conditions.push(lte(intimateLogs.date, to))

      const rows = await db.select().from(intimateLogs).where(and(...conditions)).orderBy(intimateLogs.date)
      return jsonResponse(rows)
    }

    // POST faz upsert por (userId, date) — logar o mesmo dia de novo só atualiza.
    if (req.method === 'POST') {
      const body = (await req.json()) as IntimateLogInput
      if (!body.date) return jsonResponse({ error: 'date é obrigatório' }, { status: 400 })
      const dateError = validateDateStr(body.date)
      if (dateError) return jsonResponse({ error: dateError }, { status: 400 })
      const typesError = validateEnumArray(body.types, TYPE_OPTIONS, 'types')
      if (typesError) return jsonResponse({ error: typesError }, { status: 400 })
      const penetrationError = validateEnum(body.penetration, PENETRATION_OPTIONS, 'penetration')
      if (penetrationError) return jsonResponse({ error: penetrationError }, { status: 400 })
      const painError = validateEnum(body.pain, PAIN_OPTIONS, 'pain')
      if (painError) return jsonResponse({ error: painError }, { status: 400 })
      const notesError = validateText(body.notes, 1000)
      if (notesError) return jsonResponse({ error: notesError }, { status: 400 })

      const [row] = await db
        .insert(intimateLogs)
        .values({ ...body, userId: user.id })
        .onConflictDoUpdate({
          target: [intimateLogs.userId, intimateLogs.date],
          set: {
            types: body.types ?? [],
            penetration: body.penetration ?? null,
            protection: body.protection ?? null,
            pain: body.pain ?? null,
            orgasm: body.orgasm ?? null,
            notes: body.notes ?? null,
          },
        })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const [deleted] = await db
        .delete(intimateLogs)
        .where(and(eq(intimateLogs.id, Number(id)), eq(intimateLogs.userId, user.id)))
        .returning({ id: intimateLogs.id })
      if (!deleted) return jsonResponse({ error: 'registro não encontrado' }, { status: 404 })
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('intimate-logs function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
