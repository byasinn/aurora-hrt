import type { Context } from '@netlify/functions'
import { desc, eq, inArray } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { follows, posts, communityMembers } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import { enrichPosts } from './_shared/social'
import { getOrCreateDefaultCommunity, isCommunityMember } from './_shared/community'

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

    const community = await getOrCreateDefaultCommunity(db)
    const isMember = await isCommunityMember(db, community.id, user.id)
    const communityMemberIds = isMember
      ? (
          await db
            .select({ userId: communityMembers.userId })
            .from(communityMembers)
            .where(eq(communityMembers.communityId, community.id))
        ).map((r) => r.userId)
      : []

    const authorIds = [
      ...new Set([user.id, ...myFollowing.map((f) => f.followingId), ...communityMemberIds]),
    ]

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
