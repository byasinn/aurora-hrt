import { Hono } from 'hono'
import { and, desc, eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { communityPosts } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { isCommunityMember, enrichCommunityPosts } from '../shared/community'
import { isRateLimited } from '../shared/rateLimit'
import { validateImages, validateText, validateFontStyle, validateHexColor, stripOwnerFields } from '../shared/contentLimits'
import { deleteR2Images } from '../shared/images'
import { logModerationAction } from '../shared/moderation'
import type { CommunityPostInput } from '../../shared/types'
import type { Env } from '../env'

const POST_WINDOW_MS = 60 * 60 * 1000
const POST_MAX_PER_USER = 10

const app = new Hono<{ Bindings: Env }>()

app.all('/api/community-posts', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  try {
    if (req.method === 'GET') {
      const communityId = Number(url.searchParams.get('communityId'))
      if (!communityId) return jsonResponse({ error: 'communityId é obrigatório' }, { status: 400 })
      const isMember = await isCommunityMember(db, communityId, user.id)
      if (!isMember) return jsonResponse({ error: 'entre na comunidade pra ver os posts' }, { status: 403 })
      const rows = await db
        .select()
        .from(communityPosts)
        .where(eq(communityPosts.communityId, communityId))
        .orderBy(desc(communityPosts.createdAt))
        .limit(50)
      const enriched = await enrichCommunityPosts(db, rows, user.id)
      return jsonResponse(enriched)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as CommunityPostInput & { communityId?: number }
      const { communityId, ...postFields } = body
      if (!communityId) return jsonResponse({ error: 'communityId é obrigatório' }, { status: 400 })
      const images = postFields.images as string[] | undefined
      if (!postFields.text?.trim() && (!images || images.length === 0)) {
        return jsonResponse({ error: 'post vazio' }, { status: 400 })
      }
      const imageError = validateImages(images)
      if (imageError) return jsonResponse({ error: imageError }, { status: 413 })
      const textError = validateText(postFields.text)
      if (textError) return jsonResponse({ error: textError }, { status: 400 })
      const fontError = validateFontStyle(postFields.fontStyle)
      if (fontError) return jsonResponse({ error: fontError }, { status: 400 })
      const colorError = validateHexColor(postFields.cardColor) ?? validateHexColor(postFields.cardColor2)
      if (colorError) return jsonResponse({ error: colorError }, { status: 400 })

      const isMember = await isCommunityMember(db, communityId, user.id)
      if (!isMember) return jsonResponse({ error: 'entre na comunidade pra postar' }, { status: 403 })

      if (await isRateLimited(db, `community-post:${user.id}`, POST_WINDOW_MS, POST_MAX_PER_USER)) {
        return jsonResponse({ error: 'Muitos posts em pouco tempo. Espere um pouco antes de postar de novo.' }, { status: 429 })
      }

      const [row] = await db
        .insert(communityPosts)
        .values({ ...stripOwnerFields(postFields), communityId, userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      // admin pode apagar post de qualquer conta (moderação); usuário comum só o próprio
      const ownershipFilter = user.isAdmin
        ? eq(communityPosts.id, Number(id))
        : and(eq(communityPosts.id, Number(id)), eq(communityPosts.userId, user.id))
      const [deleted] = await db
        .delete(communityPosts)
        .where(ownershipFilter)
        .returning({ userId: communityPosts.userId, text: communityPosts.text, images: communityPosts.images })
      if (deleted) {
        await deleteR2Images(c.env, (deleted.images as string[] | null) ?? [])
        if (user.isAdmin && deleted.userId !== user.id) {
          await logModerationAction(db, user.id, 'delete_community_post', deleted.userId, { text: deleted.text, images: deleted.images })
        }
      }
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('community-posts function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
