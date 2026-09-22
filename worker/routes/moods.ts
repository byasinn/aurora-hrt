import { Hono } from 'hono'
import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { moodEntries } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { validateText, validateDateStr, validateIntRange, validateIntArray, stripOwnerFields } from '../shared/contentLimits'
import type { MoodEntryInput } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/moods', async (c) => {
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
      const conditions = [eq(moodEntries.userId, user.id)]
      if (from) conditions.push(gte(moodEntries.date, from))
      if (to) conditions.push(lte(moodEntries.date, to))

      const rows = await db.select().from(moodEntries).where(and(...conditions))
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as MoodEntryInput
      if (!body.date) return jsonResponse({ error: 'date é obrigatório' }, { status: 400 })
      const dateError = validateDateStr(body.date)
      if (dateError) return jsonResponse({ error: dateError }, { status: 400 })
      const moodTagsError = validateIntArray(body.moodTagIds, 'moodTagIds')
      if (moodTagsError) return jsonResponse({ error: moodTagsError }, { status: 400 })
      const symptomTagsError = validateIntArray(body.symptomTagIds, 'symptomTagIds')
      if (symptomTagsError) return jsonResponse({ error: symptomTagsError }, { status: 400 })
      const energyError = validateIntRange(body.energyLevel, 0, 10, 'energyLevel')
      if (energyError) return jsonResponse({ error: energyError }, { status: 400 })
      const libidoError = validateIntRange(body.libidoLevel, 0, 10, 'libidoLevel')
      if (libidoError) return jsonResponse({ error: libidoError }, { status: 400 })
      const notesError = validateText(body.notes, 1000)
      if (notesError) return jsonResponse({ error: notesError }, { status: 400 })

      // upsert por (userId, date) — igual cycle-logs/intimate-logs/day-notes: registrar o mesmo dia
      // de novo (clique duplo, ou salvar antes do refetch atualizar a tela) atualiza em vez de duplicar.
      const [row] = await db
        .insert(moodEntries)
        .values({ ...body, userId: user.id })
        .onConflictDoUpdate({
          target: [moodEntries.userId, moodEntries.date],
          set: {
            moodTagIds: body.moodTagIds ?? [],
            symptomTagIds: body.symptomTagIds ?? [],
            energyLevel: body.energyLevel ?? null,
            libidoLevel: body.libidoLevel ?? null,
            notes: body.notes ?? null,
          },
        })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'PUT') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const body = (await req.json()) as Partial<MoodEntryInput>
      const moodTagsError = validateIntArray(body.moodTagIds, 'moodTagIds')
      if (moodTagsError) return jsonResponse({ error: moodTagsError }, { status: 400 })
      const symptomTagsError = validateIntArray(body.symptomTagIds, 'symptomTagIds')
      if (symptomTagsError) return jsonResponse({ error: symptomTagsError }, { status: 400 })
      const energyError = validateIntRange(body.energyLevel, 0, 10, 'energyLevel')
      if (energyError) return jsonResponse({ error: energyError }, { status: 400 })
      const libidoError = validateIntRange(body.libidoLevel, 0, 10, 'libidoLevel')
      if (libidoError) return jsonResponse({ error: libidoError }, { status: 400 })
      const notesError = validateText(body.notes, 1000)
      if (notesError) return jsonResponse({ error: notesError }, { status: 400 })

      const [row] = await db
        .update(moodEntries)
        .set(stripOwnerFields(body))
        .where(and(eq(moodEntries.id, Number(id)), eq(moodEntries.userId, user.id)))
        .returning()
      if (!row) return jsonResponse({ error: 'registro não encontrado' }, { status: 404 })
      return jsonResponse(row)
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const [deleted] = await db
        .delete(moodEntries)
        .where(and(eq(moodEntries.id, Number(id)), eq(moodEntries.userId, user.id)))
        .returning({ id: moodEntries.id })
      if (!deleted) return jsonResponse({ error: 'registro não encontrado' }, { status: 404 })
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('moods function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
