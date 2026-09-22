import { Hono } from 'hono'
import { and, desc, eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { posts } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { isRateLimited } from '../shared/rateLimit'
import { validateImages, validateText, validateFontStyle, validateHexColor, stripOwnerFields } from '../shared/contentLimits'
import { deleteR2Images } from '../shared/images'
import { canViewPost } from '../shared/social'
import { logModerationAction } from '../shared/moderation'
import type { PostInput } from '../../shared/types'
import type { Env } from '../env'

const POST_WINDOW_MS = 60 * 60 * 1000
const POST_MAX_PER_USER = 10

const app = new Hono<{ Bindings: Env }>()

app.all('/api/posts', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  try {
    if (req.method === 'GET') {
      const rows = await db
        .select()
        .from(posts)
        .where(eq(posts.userId, user.id))
        .orderBy(desc(posts.createdAt))
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as PostInput

      // repost — só de posts pessoais (não de comunidade, pra não vazar conteúdo restrito a membro)
      if (body.repostOfKind === 'post' && body.repostOfId != null) {
        const originalId = Number(body.repostOfId)
        // original não pode ser ele mesmo um repost (evita corrente de repost-de-repost, que criaria
        // cards em branco), e não pode ser conteúdo de conta que o usuário não tem permissão de ver
        // (senão repostar vira um jeito de vazar post de conta privada pra quem te segue).
        const [original] = await db.select().from(posts).where(eq(posts.id, originalId)).limit(1)
        if (!original) return jsonResponse({ error: 'post original não encontrado' }, { status: 404 })
        if (original.repostOfKind) return jsonResponse({ error: 'não dá pra repostar um repost' }, { status: 400 })
        if (original.userId != null) {
          const allowed = await canViewPost(db, user.id, original.userId)
          if (!allowed) return jsonResponse({ error: 'post original não encontrado' }, { status: 404 })
        }

        if (await isRateLimited(db, `post:${user.id}`, POST_WINDOW_MS, POST_MAX_PER_USER)) {
          return jsonResponse({ error: 'Muitos posts em pouco tempo. Espere um pouco antes de postar de novo.' }, { status: 429 })
        }

        // insert direto com onConflictDoNothing (em vez de checar-depois-inserir) fecha a corrida de
        // clique duplo — o índice único (userId, repostOfKind, repostOfId) garante isso no banco.
        const [row] = await db
          .insert(posts)
          .values({ userId: user.id, text: null, images: [], repostOfKind: 'post', repostOfId: originalId })
          .onConflictDoNothing()
          .returning()
        if (!row) return jsonResponse({ error: 'você já repostou isso' }, { status: 409 })
        return jsonResponse(row, { status: 201 })
      }

      const imageError = validateImages(body.images)
      if (imageError) return jsonResponse({ error: imageError }, { status: 413 })
      const textError = validateText(body.text)
      if (textError) return jsonResponse({ error: textError }, { status: 400 })
      const fontError = validateFontStyle(body.fontStyle)
      if (fontError) return jsonResponse({ error: fontError }, { status: 400 })
      const colorError = validateHexColor(body.cardColor) ?? validateHexColor(body.cardColor2)
      if (colorError) return jsonResponse({ error: colorError }, { status: 400 })

      if (await isRateLimited(db, `post:${user.id}`, POST_WINDOW_MS, POST_MAX_PER_USER)) {
        return jsonResponse({ error: 'Muitos posts em pouco tempo. Espere um pouco antes de postar de novo.' }, { status: 429 })
      }

      const [row] = await db
        .insert(posts)
        .values({ ...stripOwnerFields(body), userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      // admin pode apagar post de qualquer conta (moderação); usuário comum só o próprio
      const ownershipFilter = user.isAdmin ? eq(posts.id, Number(id)) : and(eq(posts.id, Number(id)), eq(posts.userId, user.id))
      const [deleted] = await db
        .delete(posts)
        .where(ownershipFilter)
        .returning({ userId: posts.userId, text: posts.text, images: posts.images })
      if (deleted) {
        await deleteR2Images(c.env, (deleted.images as string[] | null) ?? [])
        if (user.isAdmin && deleted.userId !== user.id) {
          await logModerationAction(db, user.id, 'delete_post', deleted.userId, { text: deleted.text, images: deleted.images })
        }
      }
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('posts function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
