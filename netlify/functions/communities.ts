import type { Context } from '@netlify/functions'
import { count, eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { communityMembers } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import { getOrCreateDefaultCommunity, isCommunityMember } from './_shared/community'
import type { CommunityDetail } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const community = await getOrCreateDefaultCommunity(db)
    const [isMember, [{ value: memberCount }]] = await Promise.all([
      isCommunityMember(db, community.id, user.id),
      db.select({ value: count() }).from(communityMembers).where(eq(communityMembers.communityId, community.id)),
    ])

    const result: CommunityDetail = {
      ...community,
      memberCount,
      isMember,
      isAdmin: user.isAdmin,
    }
    return jsonResponse(result)
  } catch (err) {
    console.error('communities function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
