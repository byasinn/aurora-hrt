import { Hono } from 'hono'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { communityMembers, profile } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import type { CommunityMemberWithProfile } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/community-members', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    if (req.method === 'GET') {
      // lista de membros é sensível (privacidade) — só admin do site vê quem tá em cada comunidade
      if (!user.isAdmin) return jsonResponse({ error: 'forbidden' }, { status: 403 })
      const communityId = Number(new URL(req.url).searchParams.get('communityId'))
      if (!communityId) return jsonResponse({ error: 'communityId é obrigatório' }, { status: 400 })

      const members = await db
        .select()
        .from(communityMembers)
        .where(eq(communityMembers.communityId, communityId))
        .orderBy(desc(communityMembers.joinedAt))

      const userIds = members.map((m) => m.userId)
      const profiles = userIds.length
        ? await db.select().from(profile).where(inArray(profile.userId, userIds))
        : []
      const profileByUserId = new Map(profiles.map((p) => [p.userId, p]))

      const out: CommunityMemberWithProfile[] = members.map((m) => {
        const p = profileByUserId.get(m.userId)
        return {
          userId: m.userId,
          username: p?.username ?? '',
          displayName: p?.displayName ?? '',
          avatarUrl: p?.avatarUrl ?? null,
          avatarIcon: p?.avatarIcon ?? null,
          isVerified: p?.isVerified ?? false,
          joinedAt: m.joinedAt,
        }
      })
      return jsonResponse(out)
    }

    if (req.method === 'POST') {
      const { communityId } = (await req.json()) as { communityId?: number }
      if (!communityId) return jsonResponse({ error: 'communityId é obrigatório' }, { status: 400 })
      await db
        .insert(communityMembers)
        .values({ communityId, userId: user.id })
        .onConflictDoNothing()
      return jsonResponse({ ok: true }, { status: 201 })
    }

    if (req.method === 'DELETE') {
      const communityId = Number(new URL(req.url).searchParams.get('communityId'))
      if (!communityId) return jsonResponse({ error: 'communityId é obrigatório' }, { status: 400 })
      await db
        .delete(communityMembers)
        .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('community-members function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
