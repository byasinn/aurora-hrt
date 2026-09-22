import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { postComments, postCommentLikes, posts } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { canViewPost } from '../shared/social'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/post-comment-likes', async (c) => {
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
        .select({ id: postComments.id, postAuthorId: posts.userId })
        .from(postComments)
        .innerJoin(posts, eq(posts.id, postComments.postId))
        .where(eq(postComments.id, commentId))
        .limit(1)
      if (!comment) return jsonResponse({ error: 'comentário não encontrado' }, { status: 404 })
      if (comment.postAuthorId != null && !(await canViewPost(db, user.id, comment.postAuthorId))) {
        return jsonResponse({ error: 'comentário não encontrado' }, { status: 404 })
      }

      const [row] = await db
        .insert(postCommentLikes)
        .values({ commentId, userId: user.id })
        .onConflictDoNothing()
        .returning()
      return jsonResponse(row ?? { commentId, userId: user.id }, { status: 201 })
    }

    if (req.method === 'DELETE') {
      const commentId = Number(new URL(req.url).searchParams.get('commentId'))
      if (!commentId) return jsonResponse({ error: 'commentId é obrigatório' }, { status: 400 })
      await db.delete(postCommentLikes).where(and(eq(postCommentLikes.commentId, commentId), eq(postCommentLikes.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('post-comment-likes function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
