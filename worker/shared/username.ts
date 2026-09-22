import { eq } from 'drizzle-orm'
import { profile } from '../../shared/schema'
import type { getDb } from './db'

const USERNAME_RE = /^[a-z][a-z0-9_]{2,19}$/

const RESERVED = new Set([
  'admin',
  'administrador',
  'root',
  'suporte',
  'support',
  'aurora',
  'api',
  'null',
  'undefined',
  'settings',
  'configuracoes',
  'perfil',
  'profile',
  'sistema',
  'system',
])

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8)
}

/** Gera um @username aleatório único (tipo "user4f2a9c"), pra dar de cara pra contas novas. */
export async function generateUniqueUsername(db: ReturnType<typeof getDb>): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = `user${randomSuffix()}`
    const existing = await db.select({ id: profile.id }).from(profile).where(eq(profile.username, candidate)).limit(1)
    if (existing.length === 0) return candidate
  }
  return `user${Date.now()}`
}

/** null = válido; string = mensagem de erro. */
export function validateUsernameFormat(username: string): string | null {
  if (!USERNAME_RE.test(username)) {
    return 'Nome de usuário deve ter 3-20 caracteres, começar com letra, e usar só letras minúsculas, números e underscore.'
  }
  if (RESERVED.has(username)) {
    return 'Esse nome de usuário não está disponível.'
  }
  return null
}
