import type { Context } from '@netlify/functions'
import { count, eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { follows, posts, postComments } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const [[{ value: followerCount }], [{ value: postsCount }], [{ value: commentsCount }]] = await Promise.all([
      db.select({ value: count() }).from(follows).where(eq(follows.followingId, user.id)),
      db.select({ value: count() }).from(posts).where(eq(posts.userId, user.id)),
      db.select({ value: count() }).from(postComments).where(eq(postComments.userId, user.id)),
    ])

    return jsonResponse({ followerCount, postsCount, commentsCount })
  } catch (err) {
    console.error('my-social-stats function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
