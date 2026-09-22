import { Hono } from 'hono'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { topicPages, topicPageFollows, topicPosts } from '../../shared/schema'
import { jsonResponse, requireUser, requireAdmin } from '../shared/auth'
import { validateText, validateHexColor } from '../shared/contentLimits'
import type { TopicPageInput, TopicPageWithMeta } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

const SLUG_RE = /^[a-z0-9-]{2,40}$/

app.all('/api/topic-pages', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)

  try {
    if (req.method === 'GET') {
      const auth = await requireUser(req, db)
      if (auth instanceof Response) return auth
      const { user } = auth

      const pages = await db.select().from(topicPages).where(eq(topicPages.active, true))
      const [follows, counts] = await Promise.all([
        db.select({ topicPageId: topicPageFollows.topicPageId }).from(topicPageFollows).where(eq(topicPageFollows.userId, user.id)),
        db
          .select({ topicPageId: topicPosts.topicPageId, value: sql<number>`count(*)::int` })
          .from(topicPosts)
          .groupBy(topicPosts.topicPageId),
      ])
      const followedSet = new Set(follows.map((f) => f.topicPageId))
      const countByPage = new Map(counts.map((c) => [c.topicPageId, c.value]))

      const out: TopicPageWithMeta[] = pages.map((p) => ({
        ...p,
        isFollowedByMe: followedSet.has(p.id),
        postCount: countByPage.get(p.id) ?? 0,
      }))
      return jsonResponse(out)
    }

    if (req.method === 'POST') {
      const auth = await requireAdmin(req, db)
      if (auth instanceof Response) return auth

      const body = (await req.json()) as TopicPageInput
      if (!body.slug || !SLUG_RE.test(body.slug)) {
        return jsonResponse({ error: 'slug precisa ser minúsculo, sem espaço (a-z0-9-)' }, { status: 400 })
      }
      if (!body.name?.trim()) return jsonResponse({ error: 'name é obrigatório' }, { status: 400 })
      const nameError = validateText(body.name, 60)
      if (nameError) return jsonResponse({ error: nameError }, { status: 400 })
      const descError = validateText(body.description, 300)
      if (descError) return jsonResponse({ error: descError }, { status: 400 })
      const colorError = validateHexColor(body.color)
      if (colorError) return jsonResponse({ error: colorError }, { status: 400 })

      try {
        const [row] = await db
          .insert(topicPages)
          .values({
            slug: body.slug,
            name: body.name.trim(),
            description: body.description || null,
            icon: body.icon || 'sparkles',
            color: body.color || '#7fd4e8',
          })
          .returning()
        return jsonResponse(row, { status: 201 })
      } catch (err) {
        if (err instanceof Error && 'code' in err && (err as { code: string }).code === '23505') {
          return jsonResponse({ error: 'já existe uma página de tópico com esse slug' }, { status: 409 })
        }
        throw err
      }
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('topic-pages route error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
