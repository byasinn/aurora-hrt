import { Hono } from 'hono'
import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { dayNotes } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { validateText, validateDateStr } from '../shared/contentLimits'
import type { DayNoteInput } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/day-notes', async (c) => {
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
      const conditions = [eq(dayNotes.userId, user.id)]
      if (from) conditions.push(gte(dayNotes.date, from))
      if (to) conditions.push(lte(dayNotes.date, to))

      const rows = await db.select().from(dayNotes).where(and(...conditions)).orderBy(dayNotes.date)
      return jsonResponse(rows)
    }

    // POST faz upsert por (userId, date) — logar o mesmo dia de novo só atualiza.
    if (req.method === 'POST') {
      const body = (await req.json()) as DayNoteInput
      if (!body.date) return jsonResponse({ error: 'date é obrigatório' }, { status: 400 })
      const dateError = validateDateStr(body.date)
      if (dateError) return jsonResponse({ error: dateError }, { status: 400 })
      const noteError = validateText(body.note, 2000)
      if (noteError) return jsonResponse({ error: noteError }, { status: 400 })
      if (!body.note?.trim()) return jsonResponse({ error: 'note é obrigatório' }, { status: 400 })

      const [row] = await db
        .insert(dayNotes)
        .values({ ...body, userId: user.id })
        .onConflictDoUpdate({
          target: [dayNotes.userId, dayNotes.date],
          set: { note: body.note },
        })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const [deleted] = await db
        .delete(dayNotes)
        .where(and(eq(dayNotes.id, Number(id)), eq(dayNotes.userId, user.id)))
        .returning({ id: dayNotes.id })
      if (!deleted) return jsonResponse({ error: 'registro não encontrado' }, { status: 404 })
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('day-notes function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
