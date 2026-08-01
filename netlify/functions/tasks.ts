import type { Context } from '@netlify/functions'
import { and, desc, eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { tasks } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import type { TaskInput } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  try {
    if (req.method === 'GET') {
      const rows = await db.select().from(tasks).where(eq(tasks.userId, user.id)).orderBy(desc(tasks.createdAt))
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as TaskInput
      if (!body.title?.trim()) return jsonResponse({ error: 'title é obrigatório' }, { status: 400 })
      const [row] = await db
        .insert(tasks)
        .values({ title: body.title.trim(), icon: body.icon || '✅', userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'PUT') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const body = (await req.json()) as Partial<TaskInput>
      const [row] = await db
        .update(tasks)
        .set(body)
        .where(and(eq(tasks.id, Number(id)), eq(tasks.userId, user.id)))
        .returning()
      return jsonResponse(row)
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(tasks).where(and(eq(tasks.id, Number(id)), eq(tasks.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('tasks function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
