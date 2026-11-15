// Salva (unlocked_titles) todo título que cada pessoa já alcançou com o Brilho de hoje. Rodar ANTES do
// scripts/mark-backfilled-doses.ts: aquele script tira o histórico retroativo da conta e o Brilho de
// ~100 pessoas cai — e um título só ficava salvo quando a pessoa abria a tela de Pontos. Com isso
// aqui, o aviso da 1.3.0 ("os títulos que você já tinha continuam seus") vale pra todo mundo.
//
// O Brilho aqui é a fórmula ANTIGA (a que a produção mostrava até a 1.3.0), calculada direto em SQL.
// Não usa worker/shared/pointsStats.ts de propósito: aquele código é o Brilho v2 e, na primeira vez
// que roda pra uma pessoa, congela o Brilho antigo dela em profile.legacy_brilho — se rodasse aqui,
// antes do mark-backfilled-doses, congelaria com o histórico retroativo dentro.
//
// Ordem na produção: db:push → este script → mark-backfilled-doses.ts → deploy → seed-announcement.ts
// Pode rodar de novo sem duplicar (índice único user+título).
//
// Uso: npx tsx --env-file=.env scripts/snapshot-titles.ts            (staging)
//      npx tsx --env-file=.env scripts/snapshot-titles.ts --prod     (DATABASE_URL)
import { neon } from '@neondatabase/serverless'
import { SFW_TITLES } from '../src/lib/titles'

const isProd = process.argv.includes('--prod')
const force = process.argv.includes('--force')
const url = isProd ? process.env.DATABASE_URL : process.env.STAGING_DATABASE_URL
if (!url) {
  console.error(`Faltando ${isProd ? 'DATABASE_URL' : 'STAGING_DATABASE_URL'} no ambiente.`)
  process.exit(1)
}

const sql = neon(url)

async function main() {
  // se o histórico já foi marcado, o Brilho daqui já não é mais o que a pessoa via — salvar agora não protege nada
  const [marked] = await sql`select 1 from dose_logs where backfilled = true limit 1`
  if (marked && !force) {
    console.error('Já existem doses marcadas como backfilled neste banco — rode este script antes do mark-backfilled-doses.ts (ou passe --force).')
    process.exit(1)
  }

  // posts×10 + comentários×3 + rotinas concluídas×5 + treinos×5 + check-ins de humor×2 + dias com dose tomada×1
  const rows = (await sql`
    select u.id,
      coalesce(p.c, 0) * 10 + coalesce(cp.c, 0) * 10
      + coalesce(pc.c, 0) * 3 + coalesce(cpc.c, 0) * 3
      + coalesce(r.c, 0) * 5 + coalesce(w.c, 0) * 5
      + coalesce(m.c, 0) * 2 + coalesce(d.c, 0) as brilho
    from users u
    left join (select user_id, count(*) c from posts group by 1) p on p.user_id = u.id
    left join (select user_id, count(*) c from community_posts group by 1) cp on cp.user_id = u.id
    left join (select user_id, count(*) c from post_comments group by 1) pc on pc.user_id = u.id
    left join (select user_id, count(*) c from community_post_comments group by 1) cpc on cpc.user_id = u.id
    left join (
      select rl.user_id, count(*) c from routine_logs rl join routines rt on rt.id = rl.routine_id
      where (rt.type = 'checkbox' and rl.count > 0) or (rt.type <> 'checkbox' and rt.target_count is not null and rl.count >= rt.target_count)
      group by 1
    ) r on r.user_id = u.id
    left join (select user_id, count(*) c from workout_logs group by 1) w on w.user_id = u.id
    left join (select user_id, count(*) c from mood_entries group by 1) m on m.user_id = u.id
    left join (
      select user_id, count(distinct (scheduled_for at time zone 'UTC')::date) c from dose_logs where status = 'taken' group by 1
    ) d on d.user_id = u.id
  `) as { id: number; brilho: string | number }[]

  let saved = 0
  for (const { id, brilho } of rows) {
    const value = Number(brilho)
    const reached = SFW_TITLES.filter((t) => t.threshold > 0 && value >= t.threshold)
    if (reached.length === 0) continue
    for (const t of reached) {
      const res = await sql`
        insert into unlocked_titles (user_id, title_key, track) values (${id}, ${t.key}, 'sfw')
        on conflict do nothing returning id`
      saved += res.length
    }
  }
  console.log(`${isProd ? 'PRODUÇÃO' : 'staging'}: ${rows.length} pessoa(s) conferidas, ${saved} título(s) novo(s) salvo(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
