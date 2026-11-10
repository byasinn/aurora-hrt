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
        '• Personalizar app (no botão do Aurora): tema, visual Clean ou 8-bit, moldura, borda, calendário, ícone e sons, tudo num lugar',
        '• Configurações reorganizadas: troque email e senha, escolha seu gênero, ligue a dica do dia e escolha quais notificações receber',
        '• Botões maiores, versão pra computador e sons fofos',
        '• "Você tomou?" uma hora depois do horário da dose, com botões direto na notificação',
        '• Missões (no botão do Aurora): boas-vindas, diárias e semanais, com baús de Brilho, itens da lojinha e Poções do tempo — que salvam um dia que você esqueceu de marcar. E o streak agora tem dias de folga',
        '• Brilho novo: remédio e treino valem por semana completa, rotina vale por dia (ou entra na Semana Perfeita e paga +50% no domingo), registro do dia vale mais quanto mais detalhe, e abrir o app todo dia mantém seu streak. Tudo que você já tinha continua seu',
        '• Ao abrir o app, ele pergunta das rotinas e treinos de ontem e das doses esquecidas dos últimos 10 dias',
        '• Treinos mais simples: só o nome do exercício e as séries pra marcar, sem kg nem repetição',
        '• Comunidade nova, em tópicos: abra o seu com tags, veja os mais recentes ou os mais relevantes e filtre por assunto',
        '• Lojinha por departamentos, com vendedoras e lojas desenhadas no 8-bit, loja de poções, ofertas do dia e bandeiras novas: orgulho, lésbica, bi e pan',
      ].join('\n'),
    })
    .returning()
  console.log('ok:', row)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
