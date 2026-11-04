// Salva (unlocked_titles) todo título que cada pessoa já alcançou com o Brilho de hoje. Rodar ANTES do
// scripts/mark-backfilled-doses.ts: aquele script tira o histórico retroativo da conta e o Brilho de
// ~100 pessoas cai — e um título só ficava salvo quando a pessoa abria a tela de Pontos. Com isso
// aqui, o aviso da 1.3.0 ("os títulos que você já tinha continuam seus") vale pra todo mundo.
//
// Ordem na produção: db:push → este script → mark-backfilled-doses.ts → seed-announcement.ts
// Pode rodar de novo sem duplicar (índice único user+título).
//
// Uso: npx tsx --env-file=.env scripts/snapshot-titles.ts            (staging)
//      DATABASE_URL=... npx tsx scripts/snapshot-titles.ts --prod
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import * as schema from '../shared/schema'
import { computeServerPointsStats } from '../worker/shared/pointsStats'
import { SFW_TITLES } from '../src/lib/titles'

const isProd = process.argv.includes('--prod')
const force = process.argv.includes('--force')
const url = isProd ? process.env.DATABASE_URL : process.env.STAGING_DATABASE_URL
if (!url) {
  console.error(`Faltando ${isProd ? 'DATABASE_URL' : 'STAGING_DATABASE_URL'} no ambiente.`)
  process.exit(1)
}

const db = drizzle(neon(url), { schema })

async function main() {
  // se o histórico já foi marcado, o Brilho calculado aqui já é o novo (menor) — salvar agora não protege nada
  const [marked] = await db
    .select({ id: schema.doseLogs.id })
    .from(schema.doseLogs)
    .where(eq(schema.doseLogs.backfilled, true))
    .limit(1)
  if (marked && !force) {
    console.error('Já existem doses marcadas como backfilled neste banco — rode este script antes do mark-backfilled-doses.ts (ou passe --force).')
    process.exit(1)
  }

  const users = await db.select({ id: schema.users.id }).from(schema.users)
  let saved = 0
  const BATCH = 10
  for (let i = 0; i < users.length; i += BATCH) {
    await Promise.all(
      users.slice(i, i + BATCH).map(async ({ id }) => {
        const { brilho } = await computeServerPointsStats(db, id)
        const reached = SFW_TITLES.filter((t) => t.threshold > 0 && brilho >= t.threshold)
        if (reached.length === 0) return
        const rows = await db
          .insert(schema.unlockedTitles)
          .values(reached.map((t) => ({ userId: id, titleKey: t.key, track: 'sfw' })))
          .onConflictDoNothing()
          .returning({ id: schema.unlockedTitles.id })
        saved += rows.length
      }),
    )
  }
  console.log(`${isProd ? 'PRODUÇÃO' : 'staging'}: ${users.length} pessoa(s) conferidas, ${saved} título(s) novo(s) salvo(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
