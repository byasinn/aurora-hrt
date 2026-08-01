import type { Context } from '@netlify/functions'
import { desc, eq, inArray } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { communityMessages, profile } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import { getOrCreateDefaultCommunity, isCommunityMember } from './_shared/community'
import type { CommunityMessageWithAuthor } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    const community = await getOrCreateDefaultCommunity(db)
    const isMember = await isCommunityMember(db, community.id, user.id)
    if (!isMember) return jsonResponse({ error: 'entre na comunidade pra ver o chat' }, { status: 403 })

    if (req.method === 'GET') {
      const rows = await db
        .select()
        .from(communityMessages)
        .where(eq(communityMessages.communityId, community.id))
        .orderBy(desc(communityMessages.createdAt))
        .limit(100)
      const ordered = rows.reverse()

      const authorIds = [...new Set(ordered.map((m) => m.userId))]
      const authorProfiles = authorIds.length
        ? await db.select().from(profile).where(inArray(profile.userId, authorIds))
        : []
      const profileById = new Map(authorProfiles.map((p) => [p.userId, p]))

      const out: CommunityMessageWithAuthor[] = ordered.map((m) => ({
        ...m,
        author: {
          userId: m.userId,
          displayName: profileById.get(m.userId)?.displayName ?? '',
          avatarUrl: profileById.get(m.userId)?.avatarUrl ?? null,
          avatarIcon: profileById.get(m.userId)?.avatarIcon ?? null,
        },
      }))
      return jsonResponse(out)
    }

    if (req.method === 'POST') {
      const { body } = (await req.json()) as { body?: string }
      if (!body?.trim()) return jsonResponse({ error: 'body é obrigatório' }, { status: 400 })
      const [row] = await db
        .insert(communityMessages)
        .values({ communityId: community.id, userId: user.id, body: body.trim() })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('community-messages function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
