import { and, eq, isNull, lt, or, sql } from 'drizzle-orm'
import { contentSources, topicPosts } from '../../shared/schema'
import { fetchFeed } from './rssFetch'
import { getDb } from './db'
import type { Env } from '../env'

const FEED_REFRESH_INTERVAL_MS = 30 * 60 * 1000 // não busca a mesma fonte de novo antes disso
const MAX_POSTS_PER_TOPIC = 200 // retenção — mantém o banco leve mesmo com fontes ativas por meses

/** Busca as fontes RSS/Atom que já passaram do intervalo de atualização, insere os itens novos
 * (dedup automático pelo índice único em (sourceId, url)) e apara posts antigos além do limite por
 * tópico. Chamado pelo cron de 15 em 15 min (worker/index.ts scheduled()), mas cada fonte só é
 * rebuscada a cada ~30min — a maioria dos ciclos do cron não faz nada aqui. */
export async function runFeedIngestion(env: Env): Promise<void> {
  const db = getDb(env)
  const cutoff = new Date(Date.now() - FEED_REFRESH_INTERVAL_MS)
  const dueSources = await db
    .select()
    .from(contentSources)
    .where(and(eq(contentSources.active, true), or(isNull(contentSources.lastFetchedAt), lt(contentSources.lastFetchedAt, cutoff))))

  if (dueSources.length === 0) return

  let totalInserted = 0
  for (const source of dueSources) {
    try {
      const items = await fetchFeed(source.feedUrl)
      if (items.length > 0) {
        const rows = await db
          .insert(topicPosts)
          .values(
            items.map((i) => ({
              topicPageId: source.topicPageId,
              sourceId: source.id,
              title: i.title.slice(0, 500),
              url: i.url,
              thumbnailUrl: i.thumbnailUrl,
              summary: i.summary?.slice(0, 1000) ?? null,
              sourceName: source.name,
              publishedAt: i.publishedAt,
            })),
          )
          .onConflictDoNothing()
          .returning({ id: topicPosts.id })
        totalInserted += rows.length
      }
      await db.update(contentSources).set({ lastFetchedAt: new Date(), lastError: null }).where(eq(contentSources.id, source.id))
    } catch (err) {
      console.error(`feed ingestion: fonte ${source.id} (${source.feedUrl}) falhou`, err)
      await db
        .update(contentSources)
        .set({ lastFetchedAt: new Date(), lastError: String(err).slice(0, 500) })
        .where(eq(contentSources.id, source.id))
    }
  }

  // retenção: só os MAX_POSTS_PER_TOPIC mais recentes de cada tópico sobrevivem — sem isso o banco
  // cresceria pra sempre com fonte ativa rodando 24/7.
  await db.execute(sql`
    DELETE FROM topic_posts
    WHERE id IN (
      SELECT id FROM (
        SELECT id, row_number() OVER (
          PARTITION BY topic_page_id ORDER BY coalesce(published_at, fetched_at) DESC
        ) AS rn
        FROM topic_posts
      ) ranked
      WHERE rn > ${MAX_POSTS_PER_TOPIC}
    )
  `)

  console.log(`feed-ingestion: ${dueSources.length} fonte(s) checada(s), ${totalInserted} post(s) novo(s)`)
}
