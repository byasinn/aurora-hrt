import type { Context } from '@netlify/functions'
import { and, eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { posts, postLikes } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import { canViewPost } from './_shared/social'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    if (req.method === 'POST') {
      const { postId } = (await req.json()) as { postId?: number }
      if (!postId) return jsonResponse({ error: 'postId é obrigatório' }, { status: 400 })
      const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1)
      if (!post || post.userId == null) return jsonResponse({ error: 'post não encontrado' }, { status: 404 })
      if (!(await canViewPost(db, user.id, post.userId))) {
        return jsonResponse({ error: 'forbidden' }, { status: 403 })
      }
      await db.insert(postLikes).values({ postId, userId: user.id }).onConflictDoNothing()
      return jsonResponse({ ok: true }, { status: 201 })
    }

    if (req.method === 'DELETE') {
      const postId = Number(new URL(req.url).searchParams.get('postId'))
      if (!postId) return jsonResponse({ error: 'postId é obrigatório' }, { status: 400 })
      await db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('post-likes function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
