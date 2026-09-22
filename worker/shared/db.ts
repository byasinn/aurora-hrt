import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../../shared/schema'
import type { Env } from '../env'

type Db = ReturnType<typeof drizzle<typeof schema>>

let _db: Db | null = null
let _dbUrl: string | null = null

/** Neon via HTTP serverless driver — funciona igual em produção e em `wrangler dev` local. */
export function getDb(env: Env): Db {
  if (_db && _dbUrl === env.DATABASE_URL) return _db
  const sql = neon(env.DATABASE_URL)
  _db = drizzle(sql, { schema })
  _dbUrl = env.DATABASE_URL
  return _db
}
