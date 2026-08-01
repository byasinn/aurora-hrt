import type { Context } from '@netlify/functions'
import { desc, eq, inArray } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { follows, posts } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import { enrichPosts } from './_shared/social'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const myFollowing = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, user.id))

    const authorIds = [...new Set([user.id, ...myFollowing.map((f) => f.followingId)])]

    const rawPosts = await db
      .select()
      .from(posts)
      .where(inArray(posts.userId, authorIds))
      .orderBy(desc(posts.createdAt))
      .limit(50)

    const enriched = await enrichPosts(db, rawPosts, user.id)
    return jsonResponse(enriched)
  } catch (err) {
    console.error('feed function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
