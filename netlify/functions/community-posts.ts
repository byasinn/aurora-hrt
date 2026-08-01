import type { Context } from '@netlify/functions'
import { and, desc, eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { communityPosts } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import { getOrCreateDefaultCommunity, isCommunityMember, enrichCommunityPosts } from './_shared/community'
import type { CommunityPostInput } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  try {
    const community = await getOrCreateDefaultCommunity(db)
    const isMember = await isCommunityMember(db, community.id, user.id)
    if (!isMember) return jsonResponse({ error: 'entre na comunidade pra ver os posts' }, { status: 403 })

    if (req.method === 'GET') {
      const rows = await db
        .select()
        .from(communityPosts)
        .where(eq(communityPosts.communityId, community.id))
        .orderBy(desc(communityPosts.createdAt))
        .limit(50)
      const enriched = await enrichCommunityPosts(db, rows, user.id)
      return jsonResponse(enriched)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as CommunityPostInput
      const images = body.images as string[] | undefined
      if (!body.text?.trim() && (!images || images.length === 0)) {
        return jsonResponse({ error: 'post vazio' }, { status: 400 })
      }
      const [row] = await db
        .insert(communityPosts)
        .values({ ...body, communityId: community.id, userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db
        .delete(communityPosts)
        .where(and(eq(communityPosts.id, Number(id)), eq(communityPosts.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('community-posts function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
