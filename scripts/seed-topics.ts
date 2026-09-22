// Semeia as páginas de tópico + fontes RSS iniciais (Observatório G e Metrópoles, feeds
// verificados manualmente antes de entrar aqui — ver conversa/commit pra fonte de cada um).
// Uso: STAGING_DATABASE_URL=... npx tsx scripts/seed-topics.ts --staging
//      DATABASE_URL=... npx tsx scripts/seed-topics.ts --prod
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { and, eq } from 'drizzle-orm'
import * as schema from '../shared/schema'

const isProd = process.argv.includes('--prod')
const url = isProd ? process.env.DATABASE_URL : process.env.STAGING_DATABASE_URL
if (!url) {
  console.error(`Faltando ${isProd ? 'DATABASE_URL' : 'STAGING_DATABASE_URL'} no ambiente.`)
  process.exit(1)
}

const db = drizzle(neon(url), { schema })

const TOPICS: {
  slug: string
  name: string
  description: string
  icon: string
  color: string
  sources: { name: string; feedUrl: string }[]
}[] = [
  {
    slug: 'nao-binario',
    name: 'Não-binário',
    description: 'Notícias e histórias sobre identidades não-binárias.',
    icon: 'rainbow',
    color: '#a78bfa',
    sources: [{ name: 'Observatório G — Não Binário', feedUrl: 'https://observatoriog.com.br/tag/nao-binario/feed/' }],
  },
  {
    slug: 'trans-masc',
    name: 'Trans Masc',
    description: 'Notícias e histórias sobre homens trans e pessoas transmasculinas.',
    icon: 'flag',
    color: '#5b9bd5',
    sources: [
      { name: 'Observatório G — Homem Trans', feedUrl: 'https://observatoriog.com.br/tag/homem-trans/feed/' },
      { name: 'Observatório G — Pessoas Trans', feedUrl: 'https://observatoriog.com.br/tag/pessoas-trans/feed/' },
    ],
  },
  {
    slug: 'trans-fem',
    name: 'Trans Fem',
    description: 'Notícias e histórias sobre mulheres trans e pessoas transfemininas.',
    icon: 'gem',
    color: '#f472b6',
    sources: [
      { name: 'Observatório G — Mulheres Trans', feedUrl: 'https://observatoriog.com.br/tag/mulheres-trans/feed/' },
      { name: 'Observatório G — Pessoas Trans', feedUrl: 'https://observatoriog.com.br/tag/pessoas-trans/feed/' },
    ],
  },
  {
    slug: 'moda',
    name: 'Moda',
    description: 'Tendências, estilo e moda.',
    icon: 'camera',
    color: '#e0a94e',
    sources: [{ name: 'Metrópoles — Moda', feedUrl: 'https://www.metropoles.com/vida-e-estilo/moda/feed' }],
  },
  {
    slug: 'entretenimento',
    name: 'Entretenimento',
    description: 'Séries, música, celebridades e cultura pop.',
    icon: 'party',
    color: '#fb923c',
    sources: [{ name: 'Metrópoles — Entretenimento', feedUrl: 'https://www.metropoles.com/entretenimento/feed' }],
  },
  {
    slug: 'noticias',
    name: 'Notícias',
    description: 'Notícias gerais da comunidade LGBTQIAPN+.',
    icon: 'landmark',
    color: '#4fb0a8',
    sources: [{ name: 'Observatório G', feedUrl: 'https://observatoriog.com.br/feed/' }],
  },
]

async function main() {
  for (const t of TOPICS) {
    const [row] = await db
      .insert(schema.topicPages)
      .values({ slug: t.slug, name: t.name, description: t.description, icon: t.icon, color: t.color })
      .onConflictDoNothing({ target: schema.topicPages.slug })
      .returning()

    const topicPageId =
      row?.id ??
      (await db.select({ id: schema.topicPages.id }).from(schema.topicPages).where(eq(schema.topicPages.slug, t.slug)))[0]?.id

    if (!topicPageId) {
      console.error(`não achei/criei o tópico ${t.slug}`)
      continue
    }

    for (const s of t.sources) {
      const existing = await db
        .select({ id: schema.contentSources.id })
        .from(schema.contentSources)
        .where(and(eq(schema.contentSources.topicPageId, topicPageId), eq(schema.contentSources.feedUrl, s.feedUrl)))
      if (existing.length > 0) continue
      await db.insert(schema.contentSources).values({ topicPageId, name: s.name, feedUrl: s.feedUrl })
    }
    console.log(`ok: ${t.slug} (${t.sources.length} fonte(s))`)
  }
  console.log('done')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
