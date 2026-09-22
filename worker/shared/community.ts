import { eq, and, inArray } from 'drizzle-orm'
import { communityMembers, communityPosts, communityPostLikes, communityPostComments, profile } from '../../shared/schema'
import type { CommunityFeedPost } from '../../shared/types'
import type { getDb } from './db'

export async function isCommunityMember(
  db: ReturnType<typeof getDb>,
  communityId: number,
  userId: number,
): Promise<boolean> {
  const [row] = await db
    .select()
    .from(communityMembers)
    .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)))
    .limit(1)
  return !!row
}

export async function enrichCommunityPosts(
  db: ReturnType<typeof getDb>,
  rawPosts: (typeof communityPosts.$inferSelect)[],
  viewerId: number,
): Promise<CommunityFeedPost[]> {
  if (rawPosts.length === 0) return []

  const authorIds = [...new Set(rawPosts.map((p) => p.userId))]
  const postIds = rawPosts.map((p) => p.id)

  const [authorProfiles, likeRows, commentRows] = await Promise.all([
    db.select().from(profile).where(inArray(profile.userId, authorIds)),
    db.select().from(communityPostLikes).where(inArray(communityPostLikes.postId, postIds)),
    db.select({ postId: communityPostComments.postId }).from(communityPostComments).where(inArray(communityPostComments.postId, postIds)),
  ])

  const profileById = new Map(authorProfiles.map((p) => [p.userId, p]))
  const likeCountByPost = new Map<number, number>()
  const likedByMeSet = new Set<number>()
  for (const l of likeRows) {
    likeCountByPost.set(l.postId, (likeCountByPost.get(l.postId) ?? 0) + 1)
    if (l.userId === viewerId) likedByMeSet.add(l.postId)
  }
  const commentCountByPost = new Map<number, number>()
  for (const c of commentRows) {
    commentCountByPost.set(c.postId, (commentCountByPost.get(c.postId) ?? 0) + 1)
  }

  return rawPosts.map((p) => {
    const authorProfile = profileById.get(p.userId)
    return {
      ...p,
      author: {
        userId: p.userId,
        username: authorProfile?.username ?? '',
        displayName: authorProfile?.displayName ?? '',
        avatarUrl: authorProfile?.avatarUrl ?? null,
        avatarIcon: authorProfile?.avatarIcon ?? null,
        pronouns: authorProfile?.pronouns ?? '',
        isFollowedByMe: false,
        isVerified: authorProfile?.isVerified ?? false,
      },
      likeCount: likeCountByPost.get(p.id) ?? 0,
      commentCount: commentCountByPost.get(p.id) ?? 0,
      likedByMe: likedByMeSet.has(p.id),
    }
  })
}
