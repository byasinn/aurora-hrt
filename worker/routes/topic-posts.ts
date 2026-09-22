import { Hono } from 'hono'
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { topicPages, topicPosts } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()
const PAGE_SIZE = 30

// Só existe uma página de tópico voltada pro usuário agora ("Notícias", tudo junto) — o app virou
// simples de propósito depois do feedback de que várias páginas + firehose de posts ficou ruim.
const DAILY_TOPIC_SLUG = 'noticias'
const DAILY_POOL_DAYS = 7

function hashToday(): number {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  let h = 0
  for (let i = 0; i < today.length; i++) h = (h * 31 + today.charCodeAt(i)) >>> 0
  return h
}

app.all('/api/topic-posts/daily', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const [topic] = await db.select().from(topicPages).where(eq(topicPages.slug, DAILY_TOPIC_SLUG))
    if (!topic) return jsonResponse(null)

    const since = new Date(Date.now() - DAILY_POOL_DAYS * 86_400_000)
    const pool = await db
      .select()
      .from(topicPosts)
      .where(and(eq(topicPosts.topicPageId, topic.id), gte(topicPosts.fetchedAt, since)))
      .orderBy(desc(sql`coalesce(${topicPosts.publishedAt}, ${topicPosts.fetchedAt})`))
      .limit(100)
    if (pool.length === 0) return jsonResponse(null)

    // prefere posts com foto — feed sem thumbnail (alguns sites não mandam) fica com cara de quebrado
    const withThumb = pool.filter((p) => p.thumbnailUrl)
    const candidates = withThumb.length > 0 ? withThumb : pool

    // mesmo "aleatório" o dia inteiro pra todo mundo — hash da data em vez de sortear a cada
    // request, senão cada F5 mostraria uma notícia diferente e não ia parecer "uma por dia".
    const pick = candidates[hashToday() % candidates.length]
    return jsonResponse(pick)
  } catch (err) {
    console.error('topic-posts daily route error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

app.all('/api/topic-posts', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const topicPageId = Number(new URL(req.url).searchParams.get('topicPageId'))
    if (!topicPageId) return jsonResponse({ error: 'topicPageId é obrigatório' }, { status: 400 })

    const rows = await db
      .select()
      .from(topicPosts)
      .where(eq(topicPosts.topicPageId, topicPageId))
      // coalesce pra não deixar posts sem data de publicação (alguns feeds não mandam) pularem pro
      // topo por causa de NULL vindo primeiro no ORDER BY DESC do Postgres.
      .orderBy(desc(sql`coalesce(${topicPosts.publishedAt}, ${topicPosts.fetchedAt})`))
      .limit(PAGE_SIZE)

    return jsonResponse(rows)
  } catch (err) {
    console.error('topic-posts route error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
