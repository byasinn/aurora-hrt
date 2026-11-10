// Reformulação da Comunidade: apaga as comunidades antigas (grupos — membros, posts, curtidas e
// comentários vão junto em cascata) e os tópicos do fórum, e cria os dois tópicos fixos iniciais
// (o aviso da reformulação e os tutoriais do Aurora), assinados pela primeira conta admin.
// Destrutivo: em produção só roda com --prod E --yes, e só quando a dona do app mandar.
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { asc, count, eq } from 'drizzle-orm'
import * as schema from '../shared/schema'

const isProd = process.argv.includes('--prod')
const url = isProd ? process.env.DATABASE_URL : process.env.STAGING_DATABASE_URL
if (!url) {
  console.error(`Faltando ${isProd ? 'DATABASE_URL' : 'STAGING_DATABASE_URL'} no ambiente.`)
  process.exit(1)
}
if (isProd && !process.argv.includes('--yes')) {
  console.error('Isso apaga TODAS as comunidades em produção. Rode de novo com --prod --yes se é isso mesmo.')
  process.exit(1)
}

const db = drizzle(neon(url), { schema })

const WELCOME = [
  'Oi, gente! A Comunidade mudou de cara.',
  '',
  'Os grupos antigos saíram e no lugar entrou um espaço de tópicos, tipo fórum: qualquer pessoa abre um tópico, escolhe até 3 tags (Hormônios, Dúvidas, Desabafo, Conquistas, Documentos…) e quem quiser responde.',
  '',
  'Como usar:',
  '• Toque em "+ Tópico" pra abrir o seu. Um título claro ajuda muito quem for responder.',
  '• Em cima da lista dá pra ver os mais recentes ou os mais relevantes (os que estão rendendo conversa agora).',
  '• "Tags" filtra por assunto, e a busca procura no título e no texto.',
  '• Curtiu? Toca no coração. Viu algo errado? Use a bandeirinha pra denunciar — a equipe olha tudo.',
  '',
  'Combinados pra todo mundo se sentir em casa:',
  '• Respeito sempre: pronomes, nomes e vivências de cada uma, cada um e cada ume.',
  '• Nada de dados pessoais de ninguém (endereço, telefone, documento).',
  '• Experiência com remédio é troca, não receita: na dúvida, fale com quem te acompanha.',
  '',
  'Abrir tópico, responder e curtir também contam Brilho e missões. Bem-vindes!',
].join('\n')

const TUTORIALS = [
  'Um guia rápido do Aurora. Dúvida sobre alguma parte? Responde aqui embaixo!',
  '',
  '💊 Remédios: na Home, "Adicionar remédio" cadastra a dose, os horários e os lembretes. Marque "Tomei" no dia. Se esquecer, quando você abrir o app ele pergunta das doses dos últimos 10 dias.',
  '',
  '❤️ Registrar dia: humor, energia, libido, sintomas e notas. Quanto mais detalhe, mais Brilho.',
  '',
  '✅ Rotinas: crie em "Criar rotina". Cada uma pode valer Brilho todo dia ou entrar na Semana Perfeita: paga no domingo com +50% se você fizer em todos os dias.',
  '',
  '🏋️ Treinos: monte seu programa em Treinos. Marque as séries ou toque em "Concluir treino". Bater a meta da semana dá Brilho.',
  '',
  '✨ Brilho e Missões: no botão do Aurora (meio da barra), Missões tem as de boas-vindas, as diárias e as semanais. As recompensas são Brilho, baús e Poções do tempo (salvam um dia que você esqueceu de marcar).',
  '',
  '🔥 Streak: abrir o app todo dia mantém seu streak. A cada 7 dias seguidos você ganha um baú raro e um dia de folga.',
  '',
  '🛍️ Lojinha: troque Brilho por molduras, cards, bordas, temas e calendários. Em "Personalizar app" você escolhe o que usar, inclusive o visual Clean ou 8-bit.',
  '',
  '🔒 Privacidade: em Configurações → Privacidade e segurança você escolhe o que aparece no seu perfil e pode colocar senha no app.',
].join('\n')

async function main() {
  const [admin] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.isAdmin, true)).orderBy(asc(schema.users.id)).limit(1)
  if (!admin) throw new Error('nenhuma conta admin pra assinar os tópicos')

  const [before] = await db.select({ value: count() }).from(schema.communities)
  await db.delete(schema.communities)
  await db.delete(schema.forumTopics)
  const [postsLeft] = await db.select({ value: count() }).from(schema.communityPosts)
  console.log(`comunidades apagadas: ${before?.value ?? 0} (posts de comunidade restantes: ${postsLeft?.value ?? 0})`)

  const now = Date.now()
  // o tutorial fica com atividade um pouco mais antiga pra o aviso aparecer primeiro
  await db.insert(schema.forumTopics).values([
    { userId: admin.id, title: 'Tutoriais do Aurora: comece por aqui', body: TUTORIALS, tags: ['tutoriais'], pinned: true, lastActivityAt: new Date(now - 60_000) },
    { userId: admin.id, title: 'A Comunidade mudou! Como funciona agora', body: WELCOME, tags: ['avisos'], pinned: true, lastActivityAt: new Date(now) },
  ])
  console.log('tópicos iniciais criados')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
