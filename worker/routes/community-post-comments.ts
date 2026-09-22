import { Hono } from 'hono'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { communityPosts, communityPostComments, communityPostCommentLikes, profile } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { isCommunityMember } from '../shared/community'
import { validateText } from '../shared/contentLimits'
import { isRateLimited } from '../shared/rateLimit'
import { logModerationAction } from '../shared/moderation'
import type { CommunityPostCommentWithAuthor } from '../../shared/types'
import type { Env } from '../env'

const COMMENT_WINDOW_MS = 60 * 60 * 1000
const COMMENT_MAX_PER_USER = 30

const app = new Hono<{ Bindings: Env }>()

app.all('/api/community-post-comments', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  const url = new URL(req.url)

  try {
    if (req.method === 'GET') {
      const postId = Number(url.searchParams.get('postId'))
      if (!postId) return jsonResponse({ error: 'postId é obrigatório' }, { status: 400 })
      const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, postId)).limit(1)
      if (!post) return jsonResponse({ error: 'post não encontrado' }, { status: 404 })
      const isMember = await isCommunityMember(db, post.communityId, user.id)
      if (!isMember) return jsonResponse({ error: 'forbidden' }, { status: 403 })

      const rows = await db
        .select()
        .from(communityPostComments)
        .where(eq(communityPostComments.postId, postId))
        .orderBy(communityPostComments.createdAt)
      if (rows.length === 0) return jsonResponse([])

      const authorIds = [...new Set(rows.map((r) => r.userId))]
      const commentIds = rows.map((r) => r.id)
      const [authorProfiles, likeRows] = await Promise.all([
        db.select().from(profile).where(inArray(profile.userId, authorIds)),
        db.select().from(communityPostCommentLikes).where(inArray(communityPostCommentLikes.commentId, commentIds)),
      ])
      const profileById = new Map(authorProfiles.map((p) => [p.userId, p]))
      const likeCountByComment = new Map<number, number>()
      const likedByMeSet = new Set<number>()
      for (const l of likeRows) {
        likeCountByComment.set(l.commentId, (likeCountByComment.get(l.commentId) ?? 0) + 1)
        if (l.userId === user.id) likedByMeSet.add(l.commentId)
      }

      const toItem = (r: (typeof rows)[number]): CommunityPostCommentWithAuthor => {
        const p = profileById.get(r.userId)
        return {
          ...r,
          author: {
            userId: r.userId,
            username: p?.username ?? '',
            displayName: p?.displayName ?? '',
            avatarUrl: p?.avatarUrl ?? null,
            avatarIcon: p?.avatarIcon ?? null,
            isVerified: p?.isVerified ?? false,
          },
          likeCount: likeCountByComment.get(r.id) ?? 0,
          likedByMe: likedByMeSet.has(r.id),
          replies: [],
        }
      }

      const items = rows.map(toItem)
      const itemById = new Map(items.map((i) => [i.id, i]))
      const topLevel: CommunityPostCommentWithAuthor[] = []
      for (const item of items) {
        if (item.parentCommentId != null) {
          const parent = itemById.get(item.parentCommentId)
          const root = parent?.parentCommentId != null ? itemById.get(parent.parentCommentId) : parent
          ;(root ?? item).replies.push(item)
        } else {
          topLevel.push(item)
        }
      }
      return jsonResponse(topLevel)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as { postId: number; text: string; parentCommentId?: number | null }
      if (!body.text?.trim()) return jsonResponse({ error: 'text é obrigatório' }, { status: 400 })
      const textError = validateText(body.text, 2000)
      if (textError) return jsonResponse({ error: textError }, { status: 400 })
      const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, body.postId)).limit(1)
      if (!post) return jsonResponse({ error: 'post não encontrado' }, { status: 404 })
      const isMember = await isCommunityMember(db, post.communityId, user.id)
      if (!isMember) return jsonResponse({ error: 'forbidden' }, { status: 403 })

      if (body.parentCommentId) {
        const [parent] = await db
          .select()
          .from(communityPostComments)
          .where(eq(communityPostComments.id, body.parentCommentId))
          .limit(1)
        if (!parent || parent.postId !== body.postId) {
          return jsonResponse({ error: 'comentário pai inválido' }, { status: 400 })
        }
      }

      if (await isRateLimited(db, `community-comment:${user.id}`, COMMENT_WINDOW_MS, COMMENT_MAX_PER_USER)) {
        return jsonResponse({ error: 'Muitos comentários em pouco tempo. Espere um pouco.' }, { status: 429 })
      }

      const [row] = await db
        .insert(communityPostComments)
        .values({ postId: body.postId, text: body.text.trim(), userId: user.id, parentCommentId: body.parentCommentId ?? null })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'DELETE') {
      const id = Number(url.searchParams.get('id'))
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      // admin pode apagar comentário de qualquer conta (moderação); usuário comum só o próprio
      const ownershipFilter = user.isAdmin
        ? eq(communityPostComments.id, id)
        : and(eq(communityPostComments.id, id), eq(communityPostComments.userId, user.id))
      const [deleted] = await db
        .delete(communityPostComments)
        .where(ownershipFilter)
        .returning({ userId: communityPostComments.userId, text: communityPostComments.text })
      if (deleted && user.isAdmin && deleted.userId !== user.id) {
        await logModerationAction(db, user.id, 'delete_community_comment', deleted.userId, { text: deleted.text })
      }
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('community-post-comments function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
