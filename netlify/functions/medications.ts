import type { Context } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { medications } from '../../shared/schema'
import { checkAuth, jsonResponse } from './_shared/auth'
import type { MedicationInput } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const authError = checkAuth(req)
  if (authError) return authError

  const db = getDb()
  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  try {
    if (req.method === 'GET') {
      const rows = await db.select().from(medications).orderBy(medications.createdAt)
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as MedicationInput
      const [row] = await db.insert(medications).values(body).returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'PUT') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const body = (await req.json()) as Partial<MedicationInput>
      const [row] = await db
        .update(medications)
        .set(body)
        .where(eq(medications.id, Number(id)))
        .returning()
      return jsonResponse(row)
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(medications).where(eq(medications.id, Number(id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('medications function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
