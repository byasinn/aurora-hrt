import { Hono } from 'hono'
import { count, eq, ilike, inArray } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { communities, communityMembers } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { isCommunityMember } from '../shared/community'
import type { CommunityDetail, CommunityInput, CommunitySummary } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/communities', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  try {
    if (req.method === 'GET' && id) {
      const communityId = Number(id)
      const [community] = await db.select().from(communities).where(eq(communities.id, communityId)).limit(1)
      if (!community) return jsonResponse({ error: 'comunidade não encontrada' }, { status: 404 })
      const [isMember, [{ value: memberCount }]] = await Promise.all([
        isCommunityMember(db, community.id, user.id),
        db.select({ value: count() }).from(communityMembers).where(eq(communityMembers.communityId, community.id)),
      ])
      const result: CommunityDetail = { ...community, memberCount, isMember, isAdmin: user.isAdmin }
      return jsonResponse(result)
    }

    if (req.method === 'GET') {
      const q = url.searchParams.get('q')?.trim() ?? ''
      const rows = q
        ? await db.select().from(communities).where(ilike(communities.name, `%${q}%`))
        : await db.select().from(communities)

      if (rows.length === 0) return jsonResponse([])

      const communityIds = rows.map((c) => c.id)
      const memberRows = await db
        .select()
        .from(communityMembers)
        .where(inArray(communityMembers.communityId, communityIds))

      const memberCountById = new Map<number, number>()
      const myMembershipSet = new Set<number>()
      for (const m of memberRows) {
        memberCountById.set(m.communityId, (memberCountById.get(m.communityId) ?? 0) + 1)
        if (m.userId === user.id) myMembershipSet.add(m.communityId)
      }

      const out: CommunitySummary[] = rows
        .map((c) => ({
          ...c,
          memberCount: memberCountById.get(c.id) ?? 0,
          isMember: myMembershipSet.has(c.id),
        }))
        .sort((a, b) => b.memberCount - a.memberCount)

      return jsonResponse(out)
    }

    if (req.method === 'POST') {
      if (!user.isAdmin) return jsonResponse({ error: 'forbidden' }, { status: 403 })
      const body = (await req.json()) as CommunityInput
      if (!body.name?.trim()) return jsonResponse({ error: 'name é obrigatório' }, { status: 400 })
      const [row] = await db
        .insert(communities)
        .values({
          name: body.name.trim(),
          description: body.description ?? null,
          icon: body.icon || 'heart',
          tags: body.tags ?? [],
        })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('communities function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
