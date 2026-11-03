// Marca como `backfilled` as doses que vieram do preenchimento de histórico ao cadastrar o remédio
// (worker/routes/medications.ts, backfillDoseLogs) antes da coluna existir — elas deixam de contar
// pontos e streak. Rodar uma vez por banco, depois do db:push que cria a coluna. Pode rodar de novo
// sem problema (só mexe em linha que ainda não está marcada).
//
// Critério: o preenchimento grava taken_at exatamente igual a scheduled_for, e a linha é criada dias
// depois do horário previsto. Um toque de verdade no app grava taken_at com o horário do toque, que
// nunca bate no milissegundo com o horário previsto.
//
// Uso: npx tsx --env-file=.env scripts/mark-backfilled-doses.ts            (staging)
//      DATABASE_URL=... npx tsx scripts/mark-backfilled-doses.ts --prod
import { neon } from '@neondatabase/serverless'

const isProd = process.argv.includes('--prod')
const url = isProd ? process.env.DATABASE_URL : process.env.STAGING_DATABASE_URL
if (!url) {
  console.error(`Faltando ${isProd ? 'DATABASE_URL' : 'STAGING_DATABASE_URL'} no ambiente.`)
  process.exit(1)
}

const sql = neon(url)

const rows = await sql`
  UPDATE dose_logs
  SET backfilled = true
  WHERE backfilled = false
    AND status = 'taken'
    AND taken_at = scheduled_for
    AND created_at > scheduled_for + interval '1 day'
  RETURNING user_id
`
const users = new Set(rows.map((r) => r.user_id)).size
console.log(`${isProd ? 'PRODUÇÃO' : 'staging'}: ${rows.length} dose(s) marcada(s) como histórico retroativo, de ${users} pessoa(s).`)
