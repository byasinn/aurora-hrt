// Reduz de 6 páginas de tópico pra 1 só ("Notícias", tudo junto) depois do feedback de que várias
// páginas + firehose de post ficou ruim. Reaproveita os posts e fontes já buscados (não perde nada,
// só reaponta topic_page_id pra 'noticias' e apaga as páginas antigas, que ficam vazias).
// Uso: npx tsx scripts/consolidate-topics.ts --prod (ou --staging)
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq, ne } from 'drizzle-orm'
import * as schema from '../shared/schema'

const isProd = process.argv.includes('--prod')
const url = isProd ? process.env.DATABASE_URL : process.env.STAGING_DATABASE_URL
if (!url) {
  console.error(`Faltando ${isProd ? 'DATABASE_URL' : 'STAGING_DATABASE_URL'} no ambiente.`)
  process.exit(1)
}

const db = drizzle(neon(url), { schema })
const KEEP_SLUG = 'noticias'

async function main() {
  const [keep] = await db.select().from(schema.topicPages).where(eq(schema.topicPages.slug, KEEP_SLUG))
  if (!keep) {
    console.error(`Página "${KEEP_SLUG}" não existe — roda o seed-topics.ts primeiro.`)
    process.exit(1)
  }

  const postsMoved = await db
    .update(schema.topicPosts)
    .set({ topicPageId: keep.id })
    .where(ne(schema.topicPosts.topicPageId, keep.id))
    .returning({ id: schema.topicPosts.id })
  console.log(`posts reapontados: ${postsMoved.length}`)

  const sourcesMoved = await db
    .update(schema.contentSources)
    .set({ topicPageId: keep.id })
    .where(ne(schema.contentSources.topicPageId, keep.id))
    .returning({ id: schema.contentSources.id })
  console.log(`fontes reapontadas: ${sourcesMoved.length}`)

  const deleted = await db
    .delete(schema.topicPages)
    .where(ne(schema.topicPages.id, keep.id))
    .returning({ slug: schema.topicPages.slug })
  console.log(`páginas removidas: ${deleted.map((d) => d.slug).join(', ')}`)

  console.log(`ok — tudo em "${KEEP_SLUG}" (id ${keep.id})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
