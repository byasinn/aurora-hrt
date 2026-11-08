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
      version: '1.3.0',
      title: 'Lojinha, central do Aurora e um ajuste no Brilho',
      body: [
        '• Lojinha no lugar das Dicas: troque seu Brilho por molduras de perfil, cards e bordas de post, temas, calendários e pacotes (trans, não-binário, pastel, natal, gótico e pixel art)',
        '• Botão do Aurora no meio da barra de baixo: Comunidades, Lojinha, Meus itens e Pontos num lugar só',
        '• Meus itens: escolha o que usar no perfil, nos posts e no app',
        '• Mensagens abrem direto nas conversas, e o seu perfil (com a moldura) fica no Meu espaço',
        '• Comprar não tira seus títulos — eles continuam contando todo o Brilho que você já ganhou',
        '• Sobre o Brilho: as doses que entravam sozinhas como "histórico" ao cadastrar um remédio (de antes de você usar o app) deixaram de contar pontos. Agora só conta o que você marca no dia. Por isso o número de algumas pessoas caiu — os títulos que você já tinha continuam seus',
        '• Botões maiores, versão pra computador e sons fofos (dá pra desligar em Aparência)',
        '• "Você tomou?" uma hora depois do horário da dose, com botões direto na notificação',
      ].join('\n'),
    })
    .returning()
  console.log('ok:', row)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
