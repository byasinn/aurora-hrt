import { getDatabase } from '@netlify/database'
import { drizzle as drizzleNeonHttp } from 'drizzle-orm/neon-http'
import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres'
import * as schema from '../../../shared/schema'

type Db = ReturnType<typeof drizzleNeonHttp<typeof schema>> | ReturnType<typeof drizzleNodePg<typeof schema>>

let _db: Db | null = null

/**
 * Em dev local (`netlify dev`), o Netlify Database expõe um Postgres comum via
 * driver 'server' (pg Pool). Em produção (Neon), usa o driver HTTP serverless.
 * getDatabase() decide automaticamente com base em NETLIFY_DB_DRIVER.
 */
export function getDb(): Db {
  if (_db) return _db
  const conn = getDatabase()
  _db =
    conn.driver === 'serverless'
      ? drizzleNeonHttp(conn.httpClient, { schema })
      : drizzleNodePg(conn.pool, { schema })
  return _db
}
