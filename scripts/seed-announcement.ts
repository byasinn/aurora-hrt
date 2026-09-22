// Cria o anúncio de versão (popup "o que mudou") pra essa leva de mudanças. Script avulso,
// mesmo padrão do seed-topics.ts — dá pra rodar de novo sem duplicar não, então só roda uma vez.
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../shared/schema'

const isProd = process.argv.includes('--prod')
const url = isProd ? process.env.DATABASE_URL : process.env.STAGING_DATABASE_URL
if (!url) {
  console.error(`Faltando ${isProd ? 'DATABASE_URL' : 'STAGING_DATABASE_URL'} no ambiente.`)
  process.exit(1)
}

const db = drizzle(neon(url), { schema })

async function main() {
  const [row] = await db
    .insert(schema.appAnnouncements)
    .values({
      version: '1.2.0',
      title: 'Explorar do jeito novo',
      body: [
        '• Páginas de tópico no Explorar: não-binário, trans masc, trans fem, moda, entretenimento e notícias — com posts automáticos (links de notícias e vídeos)',
        '• Siga os tópicos que te interessam e apareça sugestões de quem seguir com base nisso',
        '• Aviso de "novos posts" no topo do feed, sem perder o que você já tava vendo',
        '• Correções de scroll em alguns Android',
      ].join('\n'),
    })
    .returning()
  console.log('ok:', row)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
