import { Hono } from 'hono'
import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { cycleLogs } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { validateText, validateDateStr, validateEnum, validateStringArray } from '../shared/contentLimits'
import type { CycleLogInput } from '../../shared/types'
import type { Env } from '../env'

const FLOW_OPTIONS = ['spotting', 'light', 'medium', 'heavy'] as const

const app = new Hono<{ Bindings: Env }>()

app.all('/api/cycle-logs', async (c) => {
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
      const conditions = [eq(cycleLogs.userId, user.id)]
      if (from) conditions.push(gte(cycleLogs.date, from))
      if (to) conditions.push(lte(cycleLogs.date, to))

      const rows = await db.select().from(cycleLogs).where(and(...conditions)).orderBy(cycleLogs.date)
      return jsonResponse(rows)
    }

    // POST faz upsert por (userId, date) — logar o mesmo dia de novo só atualiza.
    if (req.method === 'POST') {
      const body = (await req.json()) as CycleLogInput
      if (!body.date) return jsonResponse({ error: 'date é obrigatório' }, { status: 400 })
      const dateError = validateDateStr(body.date)
      if (dateError) return jsonResponse({ error: dateError }, { status: 400 })
      const flowError = validateEnum(body.flow, FLOW_OPTIONS, 'flow')
      if (flowError) return jsonResponse({ error: flowError }, { status: 400 })
      const symptomsError = validateStringArray(body.symptoms, 'symptoms')
      if (symptomsError) return jsonResponse({ error: symptomsError }, { status: 400 })
      const notesError = validateText(body.notes, 1000)
      if (notesError) return jsonResponse({ error: notesError }, { status: 400 })

      const [row] = await db
        .insert(cycleLogs)
        .values({ ...body, userId: user.id })
        .onConflictDoUpdate({
          target: [cycleLogs.userId, cycleLogs.date],
          set: { flow: body.flow ?? null, symptoms: body.symptoms ?? [], notes: body.notes ?? null },
        })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const [deleted] = await db
        .delete(cycleLogs)
        .where(and(eq(cycleLogs.id, Number(id)), eq(cycleLogs.userId, user.id)))
        .returning({ id: cycleLogs.id })
      if (!deleted) return jsonResponse({ error: 'registro não encontrado' }, { status: 404 })
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('cycle-logs function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
