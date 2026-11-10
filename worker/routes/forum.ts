import { Hono } from 'hono'
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { blocks, forumReplies, forumTopicLikes, forumTopics, profile, users } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { isRateLimited } from '../shared/rateLimit'
import { logModerationAction } from '../shared/moderation'
import {
  FORUM_TAG_BY_KEY,
  REPLY_MAX,
  TOPIC_BODY_MAX,
  TOPIC_TITLE_MAX,
  validateTopicTags,
  type ForumAuthor,
  type ForumReplyView,
  type ForumTopicDetail,
  type ForumTopicSummary,
} from '../../shared/forum'
import type { Env } from '../env'

type Db = ReturnType<typeof getDb>

const app = new Hono<{ Bindings: Env }>()

async function authors(db: Db, ids: number[]): Promise<Map<number, ForumAuthor>> {
  if (ids.length === 0) return new Map()
  const rows = await db
    .select({
      id: users.id,
      isAdmin: users.isAdmin,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      avatarIcon: profile.avatarIcon,
      frame: profile.equippedAvatarFrame,
      isVerified: profile.isVerified,
    })
    .from(users)
    .leftJoin(profile, eq(profile.userId, users.id))
    .where(inArray(users.id, [...new Set(ids)]))
  return new Map(rows.map((r) => [r.id, { ...r, isVerified: r.isVerified ?? false }]))
}

/** Quem bloqueou ou foi bloqueado por mim — some dos dois lados. */
async function hiddenUserIds(db: Db, me: number): Promise<Set<number>> {
  const rows = await db
    .select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId })
    .from(blocks)
    .where(or(eq(blocks.blockerId, me), eq(blocks.blockedId, me)))
  return new Set(rows.map((r) => (r.blockerId === me ? r.blockedId : r.blockerId)))
}

function summary(t: typeof forumTopics.$inferSelect, author: ForumAuthor | null, liked: boolean): ForumTopicSummary {
  return {
    id: t.id,
    title: t.title,
    excerpt: t.body.replace(/\s+/g, ' ').slice(0, 220),
    tags: t.tags ?? [],
    pinned: t.pinned,
    locked: t.locked,
    replyCount: t.replyCount,
    likeCount: t.likeCount,
    likedByMe: liked,
    lastActivityAt: t.lastActivityAt.toISOString(),
    createdAt: t.createdAt.toISOString(),
    author,
  }
}

/** "Mais relevantes": curtida e resposta pesam, mas envelhece — tópico de ontem com 3 respostas
 * passa na frente de um de mês passado com 10. */
function relevance(t: typeof forumTopics.$inferSelect, now: number): number {
  const hours = (now - t.lastActivityAt.getTime()) / 3_600_000
  return (1 + t.likeCount * 2 + t.replyCount * 3) / Math.pow(hours + 2, 1.3)
}

app.get('/api/forum/topics', async (c) => {
  const db = getDb(c.env)
  const auth = await requireUser(c.req.raw, db)
  if (auth instanceof Response) return auth
  const me = auth.user.id
  try {
    const sort = c.req.query('sort') === 'relevant' ? 'relevant' : 'recent'
    const tag = c.req.query('tag')
    const q = (c.req.query('q') ?? '').trim().toLowerCase().slice(0, 60)
    const conditions = []
    if (tag && FORUM_TAG_BY_KEY.has(tag)) conditions.push(sql`${forumTopics.tags} @> ${JSON.stringify([tag])}::jsonb`)
    if (q) conditions.push(sql`(lower(${forumTopics.title}) like ${'%' + q + '%'} or lower(${forumTopics.body}) like ${'%' + q + '%'})`)
    const rows = await db
      .select()
      .from(forumTopics)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(forumTopics.lastActivityAt))
      .limit(300)
    const hidden = await hiddenUserIds(db, me)
    const visible = rows.filter((t) => t.userId == null || !hidden.has(t.userId))
    const now = Date.now()
    const pinned = visible.filter((t) => t.pinned)
    const rest = visible.filter((t) => !t.pinned)
    if (sort === 'relevant') rest.sort((a, b) => relevance(b, now) - relevance(a, now))
    const list = [...pinned, ...rest].slice(0, 100)

    const [authorMap, likes] = await Promise.all([
      authors(db, list.map((t) => t.userId).filter((id): id is number => id != null)),
      list.length
        ? db
            .select({ topicId: forumTopicLikes.topicId })
            .from(forumTopicLikes)
            .where(and(eq(forumTopicLikes.userId, me), inArray(forumTopicLikes.topicId, list.map((t) => t.id))))
        : Promise.resolve([]),
    ])
    const liked = new Set(likes.map((l) => l.topicId))
    return jsonResponse(list.map((t) => summary(t, t.userId ? (authorMap.get(t.userId) ?? null) : null, liked.has(t.id))))
  } catch (err) {
    console.error('forum list error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

app.get('/api/forum/topics/:id', async (c) => {
  const db = getDb(c.env)
  const auth = await requireUser(c.req.raw, db)
  if (auth instanceof Response) return auth
  const me = auth.user.id
  try {
    const id = Number(c.req.param('id'))
    const [topic] = await db.select().from(forumTopics).where(eq(forumTopics.id, id)).limit(1)
    const hidden = await hiddenUserIds(db, me)
    if (!topic || (topic.userId != null && hidden.has(topic.userId))) return jsonResponse({ error: 'tópico não encontrado' }, { status: 404 })
    const [replyRows, [like]] = await Promise.all([
      db.select().from(forumReplies).where(eq(forumReplies.topicId, id)).orderBy(forumReplies.createdAt).limit(500),
      db
        .select({ id: forumTopicLikes.id })
        .from(forumTopicLikes)
        .where(and(eq(forumTopicLikes.topicId, id), eq(forumTopicLikes.userId, me)))
        .limit(1),
    ])
    const visibleReplies = replyRows.filter((r) => !hidden.has(r.userId))
    const authorMap = await authors(db, [...(topic.userId ? [topic.userId] : []), ...visibleReplies.map((r) => r.userId)])
    const replies: ForumReplyView[] = visibleReplies.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      author: authorMap.get(r.userId) ?? null,
    }))
    const detail: ForumTopicDetail = {
      ...summary(topic, topic.userId ? (authorMap.get(topic.userId) ?? null) : null, !!like),
      body: topic.body,
      editedAt: topic.editedAt?.toISOString() ?? null,
      replies,
    }
    return jsonResponse(detail)
  } catch (err) {
    console.error('forum topic error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const t = value.trim()
  return t.length > 0 && t.length <= max ? t : null
}

app.post('/api/forum/topics', async (c) => {
  const db = getDb(c.env)
  const auth = await requireUser(c.req.raw, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  try {
    const body = (await c.req.json()) as { title?: string; body?: string; tags?: string[] }
    const title = cleanText(body.title, TOPIC_TITLE_MAX)
    const text = cleanText(body.body, TOPIC_BODY_MAX)
    if (!title || title.length < 3) return jsonResponse({ error: `título de 3 a ${TOPIC_TITLE_MAX} letras` }, { status: 400 })
    if (!text) return jsonResponse({ error: `escreva o tópico (até ${TOPIC_BODY_MAX} letras)` }, { status: 400 })
    const tagError = validateTopicTags(body.tags, user.isAdmin)
    if (tagError) return jsonResponse({ error: tagError }, { status: 400 })
    if (!user.isAdmin && (await isRateLimited(db, `forum-topic:${user.id}`, 60 * 60 * 1000, 5))) {
      return jsonResponse({ error: 'você abriu muitos tópicos agora — espera um pouquinho' }, { status: 429 })
    }
    const [row] = await db
      .insert(forumTopics)
      .values({ userId: user.id, title, body: text, tags: body.tags as string[] })
      .returning()
    return jsonResponse({ id: row.id }, { status: 201 })
  } catch (err) {
    console.error('forum create error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

// dona edita título/texto/tags; admin também fixa e tranca
app.patch('/api/forum/topics/:id', async (c) => {
  const db = getDb(c.env)
  const auth = await requireUser(c.req.raw, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  try {
    const id = Number(c.req.param('id'))
    const [topic] = await db.select().from(forumTopics).where(eq(forumTopics.id, id)).limit(1)
    if (!topic) return jsonResponse({ error: 'tópico não encontrado' }, { status: 404 })
    const isOwner = topic.userId === user.id
    if (!isOwner && !user.isAdmin) return jsonResponse({ error: 'forbidden' }, { status: 403 })
    const body = (await c.req.json()) as { title?: string; body?: string; tags?: string[]; pinned?: boolean; locked?: boolean }
    const patch: Partial<typeof forumTopics.$inferInsert> = {}
    if (body.title !== undefined) {
      const title = cleanText(body.title, TOPIC_TITLE_MAX)
      if (!title || title.length < 3) return jsonResponse({ error: `título de 3 a ${TOPIC_TITLE_MAX} letras` }, { status: 400 })
      patch.title = title
    }
    if (body.body !== undefined) {
      const text = cleanText(body.body, TOPIC_BODY_MAX)
      if (!text) return jsonResponse({ error: `texto de 1 a ${TOPIC_BODY_MAX} letras` }, { status: 400 })
      patch.body = text
    }
    if (body.tags !== undefined) {
      const tagError = validateTopicTags(body.tags, user.isAdmin)
      if (tagError) return jsonResponse({ error: tagError }, { status: 400 })
      patch.tags = body.tags
    }
    if (patch.title || patch.body || patch.tags) patch.editedAt = new Date()
    if (body.pinned !== undefined || body.locked !== undefined) {
      if (!user.isAdmin) return jsonResponse({ error: 'só a equipe fixa ou tranca tópico' }, { status: 403 })
      if (typeof body.pinned === 'boolean') patch.pinned = body.pinned
      if (typeof body.locked === 'boolean') patch.locked = body.locked
    }
    if (Object.keys(patch).length === 0) return jsonResponse({ ok: true })
    await db.update(forumTopics).set(patch).where(eq(forumTopics.id, id))
    return jsonResponse({ ok: true })
  } catch (err) {
    console.error('forum patch error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

app.delete('/api/forum/topics/:id', async (c) => {
  const db = getDb(c.env)
  const auth = await requireUser(c.req.raw, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  const id = Number(c.req.param('id'))
  const [topic] = await db.select().from(forumTopics).where(eq(forumTopics.id, id)).limit(1)
  if (!topic) return jsonResponse({ ok: true })
  if (topic.userId !== user.id && !user.isAdmin) return jsonResponse({ error: 'forbidden' }, { status: 403 })
  await db.delete(forumTopics).where(eq(forumTopics.id, id))
  if (topic.userId !== user.id) {
    await logModerationAction(db, user.id, 'delete_forum_topic', topic.userId, { title: topic.title, body: topic.body.slice(0, 500) })
  }
  return jsonResponse({ ok: true })
})

app.post('/api/forum/topics/:id/replies', async (c) => {
  const db = getDb(c.env)
  const auth = await requireUser(c.req.raw, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  try {
    const id = Number(c.req.param('id'))
    const [topic] = await db.select().from(forumTopics).where(eq(forumTopics.id, id)).limit(1)
    if (!topic) return jsonResponse({ error: 'tópico não encontrado' }, { status: 404 })
    if (topic.locked && !user.isAdmin) return jsonResponse({ error: 'esse tópico está trancado' }, { status: 403 })
    if (topic.userId != null && (await hiddenUserIds(db, user.id)).has(topic.userId)) return jsonResponse({ error: 'tópico não encontrado' }, { status: 404 })
    const { body } = (await c.req.json()) as { body?: string }
    const text = cleanText(body, REPLY_MAX)
    if (!text) return jsonResponse({ error: `resposta de 1 a ${REPLY_MAX} letras` }, { status: 400 })
    if (!user.isAdmin && (await isRateLimited(db, `forum-reply:${user.id}`, 10 * 60 * 1000, 20))) {
      return jsonResponse({ error: 'muitas respostas seguidas — respira e tenta já já' }, { status: 429 })
    }
    const [row] = await db.insert(forumReplies).values({ topicId: id, userId: user.id, body: text }).returning()
    await db
      .update(forumTopics)
      .set({ replyCount: sql`${forumTopics.replyCount} + 1`, lastActivityAt: new Date() })
      .where(eq(forumTopics.id, id))
    return jsonResponse({ id: row.id }, { status: 201 })
  } catch (err) {
    console.error('forum reply error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

app.delete('/api/forum/replies/:id', async (c) => {
  const db = getDb(c.env)
  const auth = await requireUser(c.req.raw, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  const id = Number(c.req.param('id'))
  const [reply] = await db.select().from(forumReplies).where(eq(forumReplies.id, id)).limit(1)
  if (!reply) return jsonResponse({ ok: true })
  if (reply.userId !== user.id && !user.isAdmin) return jsonResponse({ error: 'forbidden' }, { status: 403 })
  await db.delete(forumReplies).where(eq(forumReplies.id, id))
  await db
    .update(forumTopics)
    .set({ replyCount: sql`greatest(${forumTopics.replyCount} - 1, 0)` })
    .where(eq(forumTopics.id, reply.topicId))
  if (reply.userId !== user.id) await logModerationAction(db, user.id, 'delete_forum_reply', reply.userId, { body: reply.body.slice(0, 500) })
  return jsonResponse({ ok: true })
})

app.post('/api/forum/topics/:id/like', async (c) => {
  const db = getDb(c.env)
  const auth = await requireUser(c.req.raw, db)
  if (auth instanceof Response) return auth
  const me = auth.user.id
  const id = Number(c.req.param('id'))
  const [existing] = await db
    .select({ id: forumTopicLikes.id })
    .from(forumTopicLikes)
    .where(and(eq(forumTopicLikes.topicId, id), eq(forumTopicLikes.userId, me)))
    .limit(1)
  if (existing) {
    await db.delete(forumTopicLikes).where(eq(forumTopicLikes.id, existing.id))
    await db
      .update(forumTopics)
      .set({ likeCount: sql`greatest(${forumTopics.likeCount} - 1, 0)` })
      .where(eq(forumTopics.id, id))
    return jsonResponse({ liked: false })
  }
  const [row] = await db.insert(forumTopicLikes).values({ topicId: id, userId: me }).onConflictDoNothing().returning()
  if (row) await db.update(forumTopics).set({ likeCount: sql`${forumTopics.likeCount} + 1` }).where(eq(forumTopics.id, id))
  return jsonResponse({ liked: true })
})

export default app
