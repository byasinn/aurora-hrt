import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { users } from '../../shared/schema'
import { createSession, jsonResponse, sessionCookie, verifyPassword } from '../shared/auth'
import type { Env } from '../env'

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

const app = new Hono<{ Bindings: Env }>()

app.all('/api/auth-login', async (c) => {
  const req = c.req.raw
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const body = (await req.json()) as { email?: string; password?: string }
    const email = body.email?.trim().toLowerCase() ?? ''
    const password = body.password ?? ''

    const db = getDb(c.env)
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

    if (!user || !user.passwordHash) {
      return jsonResponse({ error: 'Email ou senha incorretos.' }, { status: 401 })
    }

    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      const minutes = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60_000)
      return jsonResponse(
        { error: `Muitas tentativas. Tente de novo em ${minutes} minuto${minutes === 1 ? '' : 's'}.` },
        { status: 429 },
      )
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1
      const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null
      await db
        .update(users)
        .set({ failedLoginAttempts: lockedUntil ? 0 : attempts, lockedUntil })
        .where(eq(users.id, user.id))
      return jsonResponse({ error: 'Email ou senha incorretos.' }, { status: 401 })
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await db.update(users).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, user.id))
    }

    if (user.banned) {
      return jsonResponse({ error: 'Essa conta foi banida.' }, { status: 403 })
    }

    if (!user.emailVerified) {
      return jsonResponse({ error: 'Confirme seu email antes de entrar.', code: 'EMAIL_NOT_VERIFIED' }, { status: 403 })
    }

    const { token, expiresAt } = await createSession(db, user.id)
    return jsonResponse(
      { id: user.id, email: user.email, emailVerified: user.emailVerified, isAdmin: user.isAdmin, createdAt: user.createdAt },
      { headers: { 'set-cookie': sessionCookie(token, expiresAt, c.env) } },
    )
  } catch (err) {
    console.error('auth-login error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
