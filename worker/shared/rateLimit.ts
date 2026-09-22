import { sql } from 'drizzle-orm'
import type { getDb } from './db'

/**
 * true = bloqueado (já bateu `max` ocorrências de `key` dentro de `windowMs`).
 * Só grava uma nova ocorrência quando permite passar — isso limita o crescimento
 * da tabela a no máximo `max` linhas por key por janela, mesmo sob ataque.
 *
 * Contar e inserir precisam ser UMA operação atômica, não duas (select depois insert) — senão
 * duas requisições concorrentes leem a mesma contagem antes de qualquer uma inserir, e as duas
 * passam, estourando o limite. `pg_advisory_xact_lock` serializa por key dentro do mesmo statement
 * (o driver HTTP do Neon roda cada `db.execute` como uma transação implícita própria), então a
 * segunda requisição só conta depois que a primeira já terminou de inserir.
 */
export async function isRateLimited(
  db: ReturnType<typeof getDb>,
  key: string,
  windowMs: number,
  max: number,
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs)
  const result = await db.execute<{ id: number }>(sql`
    WITH lock AS (
      SELECT pg_advisory_xact_lock(hashtext(${key})) AS _lock
    ), recent AS (
      SELECT count(*)::int AS c FROM rate_limit_hits, lock WHERE key = ${key} AND created_at > ${since}
    )
    INSERT INTO rate_limit_hits (key)
    SELECT ${key} FROM recent WHERE c < ${max}
    RETURNING id
  `)
  return result.rows.length === 0
}

export function clientIp(req: Request): string {
  return req.headers.get('cf-connecting-ip') ?? 'unknown'
}

// Limitador em memória (por isolate do Worker) — sem custo de banco, usado no freio global de GET
// (worker/index.ts), que roda em TODA requisição de leitura e não vale a pena gravar uma linha em
// rate_limit_hits por causa disso (a tabela cresceria muito rápido só de polling normal do app).
// Não é perfeitamente distribuído entre isolates/regiões da Cloudflare — cada isolate tem sua
// própria contagem —, mas funciona como freio rápido contra uma única origem martelando a API.
// Abuso que realmente importa (cadastro, login, posts, denúncias, e agora escrita em geral) continua
// batendo em `isRateLimited`, que É confiável entre isolates porque mora no banco.
const memoryHits = new Map<string, number[]>()
const MEMORY_MAX_KEYS = 5000 // trava de sanidade contra crescimento sem limite num isolate de vida longa

export function isRateLimitedInMemory(key: string, windowMs: number, max: number): boolean {
  const now = Date.now()
  const since = now - windowMs
  let hits = memoryHits.get(key)
  if (!hits) {
    if (memoryHits.size >= MEMORY_MAX_KEYS) memoryHits.clear()
    hits = []
    memoryHits.set(key, hits)
  }
  while (hits.length > 0 && hits[0] < since) hits.shift()
  if (hits.length >= max) return true
  hits.push(now)
  return false
}
