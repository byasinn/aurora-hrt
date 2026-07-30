import type { Context } from '@netlify/functions'
import { desc, eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { messages } from '../../shared/schema'
import { checkAuth, jsonResponse } from './_shared/auth'
import type { MessageInput } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const authError = checkAuth(req)
  if (authError) return authError

  const db = getDb()
  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  try {
    if (req.method === 'GET') {
      const rows = await db.select().from(messages).orderBy(desc(messages.createdAt))
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as MessageInput
      const [row] = await db.insert(messages).values(body).returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'PUT') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const body = (await req.json()) as Partial<MessageInput>
      const [row] = await db.update(messages).set(body).where(eq(messages.id, Number(id))).returning()
      return jsonResponse(row)
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(messages).where(eq(messages.id, Number(id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('messages function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
