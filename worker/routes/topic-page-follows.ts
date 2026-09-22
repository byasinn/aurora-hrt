import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { topicPageFollows } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/topic-page-follows', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    if (req.method === 'POST') {
      const { topicPageId } = (await req.json()) as { topicPageId?: number }
      if (!topicPageId) return jsonResponse({ error: 'topicPageId é obrigatório' }, { status: 400 })
      await db.insert(topicPageFollows).values({ topicPageId, userId: user.id }).onConflictDoNothing()
      return jsonResponse({ ok: true }, { status: 201 })
    }

    if (req.method === 'DELETE') {
      const topicPageId = Number(new URL(req.url).searchParams.get('topicPageId'))
      if (!topicPageId) return jsonResponse({ error: 'topicPageId é obrigatório' }, { status: 400 })
      await db
        .delete(topicPageFollows)
        .where(and(eq(topicPageFollows.topicPageId, topicPageId), eq(topicPageFollows.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('topic-page-follows route error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
