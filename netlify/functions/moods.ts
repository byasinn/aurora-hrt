import type { Context } from '@netlify/functions'
import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { moodEntries } from '../../shared/schema'
import { checkAuth, jsonResponse } from './_shared/auth'
import type { MoodEntryInput } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const authError = checkAuth(req)
  if (authError) return authError

  const db = getDb()
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  try {
    if (req.method === 'GET') {
      const conditions = []
      if (from) conditions.push(gte(moodEntries.date, from))
      if (to) conditions.push(lte(moodEntries.date, to))

      const rows = conditions.length
        ? await db.select().from(moodEntries).where(and(...conditions))
        : await db.select().from(moodEntries)
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as MoodEntryInput
      const [row] = await db.insert(moodEntries).values(body).returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'PUT') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const body = (await req.json()) as Partial<MoodEntryInput>
      const [row] = await db
        .update(moodEntries)
        .set(body)
        .where(eq(moodEntries.id, Number(id)))
        .returning()
      return jsonResponse(row)
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(moodEntries).where(eq(moodEntries.id, Number(id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('moods function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
