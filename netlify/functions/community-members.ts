import type { Context } from '@netlify/functions'
import { and, eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { communityMembers } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import { getOrCreateDefaultCommunity } from './_shared/community'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    const community = await getOrCreateDefaultCommunity(db)

    if (req.method === 'POST') {
      await db
        .insert(communityMembers)
        .values({ communityId: community.id, userId: user.id })
        .onConflictDoNothing()
      return jsonResponse({ ok: true }, { status: 201 })
    }

    if (req.method === 'DELETE') {
      await db
        .delete(communityMembers)
        .where(and(eq(communityMembers.communityId, community.id), eq(communityMembers.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('community-members function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
