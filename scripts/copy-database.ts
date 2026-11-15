// Copia todos os dados de um banco Postgres pra outro (a mudança do banco de produção pra São Paulo).
// Origem: OLD_DATABASE_URL (o banco que a produção usa hoje). Destino: DATABASE_URL (o novo, já com o
// schema aplicado por `npm run db:push` e SEM nenhuma conta — o script se recusa se tiver).
//
// - copia tabela por tabela, na ordem das chaves estrangeiras (quem é referenciado vai antes)
// - os valores saem como JSON gerado pelo próprio Postgres (row_to_json) e entram com
//   json_populate_recordset: datas, timestamps com fuso e jsonb chegam idênticos, sem passar pelo JS
// - só as colunas que existem nos dois lados; coluna nova do destino fica com o default dela
// - no fim acerta os contadores de id (sequences) e compara a contagem de linhas de cada tabela
//
// Uso: npx tsx --env-file=.env scripts/copy-database.ts
import { neon } from '@neondatabase/serverless'

const SRC = process.env.OLD_DATABASE_URL
const DST = process.env.DATABASE_URL
if (!SRC || !DST) {
  console.error('Faltando OLD_DATABASE_URL (origem) ou DATABASE_URL (destino) no ambiente.')
  process.exit(1)
}
if (SRC === DST) {
  console.error('Origem e destino são o mesmo banco.')
  process.exit(1)
}

const src = neon(SRC)
const dst = neon(DST)
const BATCH = 1000

async function tables(sql: typeof src): Promise<string[]> {
  const rows = (await sql`select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'`) as { table_name: string }[]
  return rows.map((r) => r.table_name)
}

async function columns(sql: typeof src, table: string): Promise<string[]> {
  const rows = (await sql`select column_name from information_schema.columns where table_schema = 'public' and table_name = ${table} order by ordinal_position`) as {
    column_name: string
  }[]
  return rows.map((r) => r.column_name)
}

/** Ordem em que dá pra inserir sem quebrar chave estrangeira. */
async function insertOrder(names: string[]): Promise<string[]> {
  const fks = (await src`
    select tc.table_name as child, ccu.table_name as parent
    from information_schema.table_constraints tc
    join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'`) as { child: string; parent: string }[]
  const deps = new Map(names.map((n) => [n, new Set<string>()]))
  for (const { child, parent } of fks) if (child !== parent && deps.has(child) && deps.has(parent)) deps.get(child)!.add(parent)
  const order: string[] = []
  const done = new Set<string>()
  while (order.length < names.length) {
    const ready = names.filter((n) => !done.has(n) && [...deps.get(n)!].every((p) => done.has(p)))
    if (ready.length === 0) throw new Error(`dependência circular entre: ${names.filter((n) => !done.has(n)).join(', ')}`)
    for (const n of ready.sort()) {
      order.push(n)
      done.add(n)
    }
  }
  return order
}

const q = (ident: string) => `"${ident.replace(/"/g, '""')}"`

async function main() {
  const [{ n: existing }] = (await dst`select count(*)::int as n from users`) as { n: number }[]
  if (existing > 0) {
    console.error(`O destino já tem ${existing} conta(s). Pra não misturar dados, ele precisa estar vazio.`)
    process.exit(1)
  }

  const srcTables = await tables(src)
  const dstTables = new Set(await tables(dst))
  const skipped = srcTables.filter((t) => !dstTables.has(t) && t !== '__drizzle_migrations')
  if (skipped.length) console.warn(`Tabelas que não existem no destino (não copiadas): ${skipped.join(', ')}`)
  const order = await insertOrder(srcTables.filter((t) => dstTables.has(t)))

  const report: { table: string; src: number; dst: number }[] = []
  for (const table of order) {
    const srcCols = await columns(src, table)
    const dstCols = new Set(await columns(dst, table))
    const cols = srcCols.filter((c) => dstCols.has(c))
    const missing = srcCols.filter((c) => !dstCols.has(c))
    if (missing.length) console.warn(`  ${table}: colunas que não existem no destino (ignoradas): ${missing.join(', ')}`)
    const hasId = cols.includes('id')
    const colList = cols.map(q).join(', ')

    let copied = 0
    let lastId = -1
    let offset = 0
    for (;;) {
      // paginado por id quando tem (rápido em tabela grande); senão por offset
      const page = (await src.query(
        hasId
          ? `select row_to_json(t)::text as r from ${q(table)} t where id > $1 order by id limit ${BATCH}`
          : `select row_to_json(t)::text as r from ${q(table)} t order by 1 limit ${BATCH} offset $1`,
        [hasId ? lastId : offset],
      )) as { r: string }[]
      if (page.length === 0) break
      const json = `[${page.map((p) => p.r).join(',')}]`
      await dst.query(`insert into ${q(table)} (${colList}) select ${colList} from json_populate_recordset(null::${q(table)}, $1::json)`, [json])
      copied += page.length
      if (hasId) lastId = JSON.parse(page[page.length - 1].r).id
      offset += page.length
      if (page.length < BATCH) break
    }
    // contador do id (só quando o id é serial — sessions, por exemplo, usa texto)
    const [seq] = (await dst.query(`select pg_get_serial_sequence('${table}', 'id') as s`)) as { s: string | null }[]
    if (hasId && seq?.s) {
      await dst.query(`select setval('${seq.s}', coalesce((select max(id) from ${q(table)}), 1), (select max(id) from ${q(table)}) is not null)`)
    }
    const [{ n: srcCount }] = (await src.query(`select count(*)::int as n from ${q(table)}`)) as { n: number }[]
    const [{ n: dstCount }] = (await dst.query(`select count(*)::int as n from ${q(table)}`)) as { n: number }[]
    report.push({ table, src: srcCount, dst: dstCount })
    console.log(`${dstCount === srcCount ? 'ok ' : '!! '} ${table}: ${copied} copiada(s) (origem ${srcCount}, destino ${dstCount})`)
  }

  const bad = report.filter((r) => r.src !== r.dst)
  if (bad.length) {
    console.error(`\nATENÇÃO: contagem diferente em ${bad.map((b) => b.table).join(', ')}`)
    process.exit(1)
  }
  console.log(`\nTudo copiado: ${report.length} tabela(s), ${report.reduce((s, r) => s + r.dst, 0)} linha(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
