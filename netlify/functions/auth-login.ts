import type { Context } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { users } from '../../shared/schema'
import { createSession, jsonResponse, sessionCookie, verifyPassword } from './_shared/auth'

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const body = (await req.json()) as { email?: string; password?: string }
    const email = body.email?.trim().toLowerCase() ?? ''
    const password = body.password ?? ''

    const db = getDb()
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

    if (!user || !user.passwordHash) {
      return jsonResponse({ error: 'Email ou senha incorretos.' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return jsonResponse({ error: 'Email ou senha incorretos.' }, { status: 401 })
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
      { headers: { 'set-cookie': sessionCookie(token, expiresAt) } },
    )
  } catch (err) {
    console.error('auth-login error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
