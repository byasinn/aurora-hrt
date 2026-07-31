import type { Context } from '@netlify/functions'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto'
import { eq, and, gt } from 'drizzle-orm'
import { sessions, users } from '../../../shared/schema'
import type { PublicUser } from '../../../shared/types'
import type { getDb } from './db'

const SESSION_COOKIE = 'session'
const SESSION_DAYS = 30
const SCRYPT_KEYLEN = 64

// N=2^15 — padrão OWASP pra hashing interativo, equilíbrio com o tempo de execução numa function serverless
function scryptWithParams(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, SCRYPT_KEYLEN, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey as Buffer)
    })
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scryptWithParams(password, salt)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false
  const salt = Buffer.from(saltHex, 'hex')
  const expected = Buffer.from(hashHex, 'hex')
  const actual = await scryptWithParams(password, salt)
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

// Usado pra tokens de verificação de email / reset de senha (não são a sessão em si)
export function randomToken(): string {
  return randomBytes(32).toString('base64url')
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(
  db: ReturnType<typeof getDb>,
  userId: number,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt })
  return { token, expiresAt }
}

export async function deleteSession(db: ReturnType<typeof getDb>, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, hashToken(token)))
}

function isDev(): boolean {
  return process.env.NETLIFY_DEV === 'true'
}

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.get('cookie')
  if (!header) return {}
  const out: Record<string, string> = {}
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    out[key] = decodeURIComponent(value)
  }
  return out
}

export function buildCookie(
  name: string,
  value: string,
  opts: { maxAgeSeconds?: number; path?: string } = {},
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`]
  parts.push(`Path=${opts.path ?? '/'}`)
  parts.push('HttpOnly')
  parts.push('SameSite=Lax')
  if (!isDev()) parts.push('Secure')
  if (opts.maxAgeSeconds !== undefined) parts.push(`Max-Age=${opts.maxAgeSeconds}`)
  return parts.join('; ')
}

export function sessionCookie(token: string, expiresAt: Date): string {
  const maxAgeSeconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
  return buildCookie(SESSION_COOKIE, token, { maxAgeSeconds })
}

export function clearSessionCookie(): string {
  return buildCookie(SESSION_COOKIE, '', { maxAgeSeconds: 0 })
}

export async function getSessionUser(
  req: Request,
  db: ReturnType<typeof getDb>,
): Promise<PublicUser | null> {
  const cookies = parseCookies(req)
  const token = cookies[SESSION_COOKIE]
  if (!token) return null

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1)

  return row ?? null
}

/**
 * Usa no início de toda function protegida: `const auth = await requireUser(req, db); if (auth instanceof Response) return auth`.
 * Só valida sessão — não faz escopo por dono do dado, isso é feito em cada function com `user.id`.
 */
export async function requireUser(
  req: Request,
  db: ReturnType<typeof getDb>,
): Promise<{ user: PublicUser } | Response> {
  const user = await getSessionUser(req, db)
  if (!user) {
    return jsonResponse({ error: 'unauthorized' }, { status: 401 })
  }
  return { user }
}

export function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isEmailAllowed(email: string): boolean {
  const list = allowedEmails()
  if (list.length === 0) return false
  return list.includes(email.trim().toLowerCase())
}

export function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
}

export type FnContext = Context
