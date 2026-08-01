import type { Context } from '@netlify/functions'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { communityPosts, communityPostComments, profile } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import { getOrCreateDefaultCommunity, isCommunityMember } from './_shared/community'
import type { CommunityPostCommentWithAuthor } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  const url = new URL(req.url)

  try {
    const community = await getOrCreateDefaultCommunity(db)
    const isMember = await isCommunityMember(db, community.id, user.id)
    if (!isMember) return jsonResponse({ error: 'forbidden' }, { status: 403 })

    if (req.method === 'GET') {
      const postId = Number(url.searchParams.get('postId'))
      if (!postId) return jsonResponse({ error: 'postId é obrigatório' }, { status: 400 })
      const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, postId)).limit(1)
      if (!post) return jsonResponse({ error: 'post não encontrado' }, { status: 404 })

      const rows = await db
        .select()
        .from(communityPostComments)
        .where(eq(communityPostComments.postId, postId))
        .orderBy(communityPostComments.createdAt)
      const authorIds = [...new Set(rows.map((r) => r.userId))]
      const authorProfiles = authorIds.length
        ? await db.select().from(profile).where(inArray(profile.userId, authorIds))
        : []
      const profileById = new Map(authorProfiles.map((p) => [p.userId, p]))

      const out: CommunityPostCommentWithAuthor[] = rows.map((r) => ({
        ...r,
        author: {
          userId: r.userId,
          displayName: profileById.get(r.userId)?.displayName ?? '',
          avatarUrl: profileById.get(r.userId)?.avatarUrl ?? null,
          avatarIcon: profileById.get(r.userId)?.avatarIcon ?? null,
        },
      }))
      return jsonResponse(out)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as { postId: number; text: string }
      if (!body.text?.trim()) return jsonResponse({ error: 'text é obrigatório' }, { status: 400 })
      const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, body.postId)).limit(1)
      if (!post) return jsonResponse({ error: 'post não encontrado' }, { status: 404 })
      const [row] = await db
        .insert(communityPostComments)
        .values({ postId: body.postId, text: body.text.trim(), userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'DELETE') {
      const id = Number(url.searchParams.get('id'))
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(communityPostComments).where(and(eq(communityPostComments.id, id), eq(communityPostComments.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('community-post-comments function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
