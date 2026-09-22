import { Hono } from 'hono'
import { and, desc, eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { messages } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { validateText, stripOwnerFields } from '../shared/contentLimits'
import type { MessageInput } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/messages', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
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
      const titleError = validateText(body.title, 200)
      if (titleError) return jsonResponse({ error: titleError }, { status: 400 })
      const bodyError = validateText(body.body, 2000)
      if (bodyError) return jsonResponse({ error: bodyError }, { status: 400 })
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
        .set(stripOwnerFields(body))
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
})

export default app
