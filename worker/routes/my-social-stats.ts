import { Hono } from 'hono'
import { count, eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { follows, posts, postComments, communityPosts, communityPostComments } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/my-social-stats', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const [
      [{ value: followerCount }],
      [{ value: postsCount }],
      [{ value: commentsCount }],
      [{ value: communityPostsCount }],
      [{ value: communityCommentsCount }],
    ] = await Promise.all([
      db.select({ value: count() }).from(follows).where(eq(follows.followingId, user.id)),
      db.select({ value: count() }).from(posts).where(eq(posts.userId, user.id)),
      db.select({ value: count() }).from(postComments).where(eq(postComments.userId, user.id)),
      db.select({ value: count() }).from(communityPosts).where(eq(communityPosts.userId, user.id)),
      db.select({ value: count() }).from(communityPostComments).where(eq(communityPostComments.userId, user.id)),
    ])

    return jsonResponse({ followerCount, postsCount, commentsCount, communityPostsCount, communityCommentsCount })
  } catch (err) {
    console.error('my-social-stats function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
