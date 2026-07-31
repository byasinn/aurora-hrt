import type { Context } from '@netlify/functions'
import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { moodEntries } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import type { MoodEntryInput } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const db = getDb()
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
      const [row] = await db
        .insert(moodEntries)
        .values({ ...body, userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'PUT') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const body = (await req.json()) as Partial<MoodEntryInput>
      const [row] = await db
        .update(moodEntries)
        .set(body)
        .where(and(eq(moodEntries.id, Number(id)), eq(moodEntries.userId, user.id)))
        .returning()
      return jsonResponse(row)
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(moodEntries).where(and(eq(moodEntries.id, Number(id)), eq(moodEntries.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('moods function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
