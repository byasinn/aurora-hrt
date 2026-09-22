import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { communityPosts, communityPostLikes } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { isCommunityMember } from '../shared/community'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/community-post-likes', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    if (req.method === 'POST') {
      const { postId } = (await req.json()) as { postId?: number }
      if (!postId) return jsonResponse({ error: 'postId é obrigatório' }, { status: 400 })
      const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, postId)).limit(1)
      if (!post) return jsonResponse({ error: 'post não encontrado' }, { status: 404 })
      const isMember = await isCommunityMember(db, post.communityId, user.id)
      if (!isMember) return jsonResponse({ error: 'forbidden' }, { status: 403 })
      await db.insert(communityPostLikes).values({ postId, userId: user.id }).onConflictDoNothing()
      return jsonResponse({ ok: true }, { status: 201 })
    }

    if (req.method === 'DELETE') {
      const postId = Number(new URL(req.url).searchParams.get('postId'))
      if (!postId) return jsonResponse({ error: 'postId é obrigatório' }, { status: 400 })
      await db
        .delete(communityPostLikes)
        .where(and(eq(communityPostLikes.postId, postId), eq(communityPostLikes.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('community-post-likes function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
