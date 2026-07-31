import type { Context } from '@netlify/functions'
import { and, eq, ilike, isNotNull, ne } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { profile, follows } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import type { PublicUserSummary } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? ''
  if (!q) return jsonResponse([])

  try {
    const rows = await db
      .select({
        userId: profile.userId,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        avatarIcon: profile.avatarIcon,
        pronouns: profile.pronouns,
      })
      .from(profile)
      .where(and(ilike(profile.displayName, `%${q}%`), isNotNull(profile.userId), ne(profile.userId, user.id)))
      .limit(20)

    const myFollowing = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, user.id))
    const followingSet = new Set(myFollowing.map((f) => f.followingId))

    const results: PublicUserSummary[] = rows.map((r) => ({
      userId: r.userId!,
      displayName: r.displayName,
      avatarUrl: r.avatarUrl,
      avatarIcon: r.avatarIcon,
      pronouns: r.pronouns,
      isFollowedByMe: followingSet.has(r.userId!),
    }))

    return jsonResponse(results)
  } catch (err) {
    console.error('users-search function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
