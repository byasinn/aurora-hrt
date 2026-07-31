import type { Context } from '@netlify/functions'
import { and, desc, eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { messages } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import type { MessageInput } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  try {
    if (req.method === 'GET') {
      const rows = await db
        .select()
        .from(messages)
        .where(eq(messages.userId, user.id))
        .orderBy(desc(messages.createdAt))
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as MessageInput
      const [row] = await db
        .insert(messages)
        .values({ ...body, userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'PUT') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const body = (await req.json()) as Partial<MessageInput>
      const [row] = await db
        .update(messages)
        .set(body)
        .where(and(eq(messages.id, Number(id)), eq(messages.userId, user.id)))
        .returning()
      return jsonResponse(row)
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(messages).where(and(eq(messages.id, Number(id)), eq(messages.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('messages function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
