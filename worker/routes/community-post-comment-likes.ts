import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { communityPostComments, communityPostCommentLikes } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/community-post-comment-likes', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    if (req.method === 'POST') {
      const { commentId } = (await req.json()) as { commentId?: number }
      if (!commentId) return jsonResponse({ error: 'commentId é obrigatório' }, { status: 400 })
      const [comment] = await db
        .select({ id: communityPostComments.id })
        .from(communityPostComments)
        .where(eq(communityPostComments.id, commentId))
        .limit(1)
      if (!comment) return jsonResponse({ error: 'comentário não encontrado' }, { status: 404 })

      const [row] = await db
        .insert(communityPostCommentLikes)
        .values({ commentId, userId: user.id })
        .onConflictDoNothing()
        .returning()
      return jsonResponse(row ?? { commentId, userId: user.id }, { status: 201 })
    }

    if (req.method === 'DELETE') {
      const commentId = Number(new URL(req.url).searchParams.get('commentId'))
      if (!commentId) return jsonResponse({ error: 'commentId é obrigatório' }, { status: 400 })
      await db
        .delete(communityPostCommentLikes)
        .where(and(eq(communityPostCommentLikes.commentId, commentId), eq(communityPostCommentLikes.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('community-post-comment-likes function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
