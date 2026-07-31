import { and, desc, eq, inArray } from 'drizzle-orm'
import { follows, postLikes, postComments, posts, profile } from '../../../shared/schema'
import type { FeedPost } from '../../../shared/types'
import type { getDb } from './db'

export async function isFollowing(
  db: ReturnType<typeof getDb>,
  followerId: number,
  followingId: number,
): Promise<boolean> {
  const [row] = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1)
  return !!row
}

export async function canViewPost(
  db: ReturnType<typeof getDb>,
  viewerId: number,
  authorId: number,
): Promise<boolean> {
  if (viewerId === authorId) return true
  return isFollowing(db, viewerId, authorId)
}

export async function enrichPosts(
  db: ReturnType<typeof getDb>,
  rawPosts: (typeof posts.$inferSelect)[],
  viewerId: number,
): Promise<FeedPost[]> {
  if (rawPosts.length === 0) return []

  const authorIds = [...new Set(rawPosts.map((p) => p.userId).filter((id): id is number => id != null))]
  const [authorProfiles, likeRows, commentRows, myFollowing] = await Promise.all([
    authorIds.length ? db.select().from(profile).where(inArray(profile.userId, authorIds)) : Promise.resolve([]),
    db.select().from(postLikes).where(
      inArray(
        postLikes.postId,
        rawPosts.map((p) => p.id),
      ),
    ),
    db
      .select({ postId: postComments.postId })
      .from(postComments)
      .where(
        inArray(
          postComments.postId,
          rawPosts.map((p) => p.id),
        ),
      ),
    db.select({ followingId: follows.followingId }).from(follows).where(eq(follows.followerId, viewerId)),
  ])

  const profileById = new Map(authorProfiles.map((p) => [p.userId, p]))
  const followingSet = new Set(myFollowing.map((f) => f.followingId))

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
    const authorProfile = p.userId != null ? profileById.get(p.userId) : undefined
    return {
      ...p,
      author: {
        userId: p.userId!,
        displayName: authorProfile?.displayName ?? '',
        avatarUrl: authorProfile?.avatarUrl ?? null,
        avatarIcon: authorProfile?.avatarIcon ?? null,
        pronouns: authorProfile?.pronouns ?? '',
        isFollowedByMe: p.userId != null && followingSet.has(p.userId),
      },
      likeCount: likeCountByPost.get(p.id) ?? 0,
      commentCount: commentCountByPost.get(p.id) ?? 0,
      likedByMe: likedByMeSet.has(p.id),
    }
  })
}

export async function postsByUser(
  db: ReturnType<typeof getDb>,
  authorId: number,
): Promise<(typeof posts.$inferSelect)[]> {
  return db.select().from(posts).where(eq(posts.userId, authorId)).orderBy(desc(posts.createdAt))
}
