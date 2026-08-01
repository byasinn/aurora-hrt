import type { Context } from '@netlify/functions'
import { eq, and, gt } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { emailTokens, users, sessions } from '../../shared/schema'
import { createSession, hashPassword, jsonResponse, sessionCookie } from './_shared/auth'

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const body = (await req.json()) as { token?: string; newPassword?: string }
    const token = body.token ?? ''
    const newPassword = body.newPassword ?? ''

    if (newPassword.length < 8) {
      return jsonResponse({ error: 'Senha precisa ter pelo menos 8 caracteres.' }, { status: 400 })
    }

    const db = getDb()
    const [row] = await db
      .select()
      .from(emailTokens)
      .where(and(eq(emailTokens.token, token), eq(emailTokens.type, 'reset_password'), gt(emailTokens.expiresAt, new Date())))
      .limit(1)

    if (!row) {
      return jsonResponse({ error: 'Link inválido ou expirado.' }, { status: 400 })
    }

    const passwordHash = await hashPassword(newPassword)
    const [user] = await db.update(users).set({ passwordHash }).where(eq(users.id, row.userId)).returning()

    await db.delete(emailTokens).where(eq(emailTokens.id, row.id))
    // Invalida todas as sessões antigas — troca de senha derruba logins existentes por segurança.
    await db.delete(sessions).where(eq(sessions.userId, user.id))

    const { token: sessionToken, expiresAt } = await createSession(db, user.id)
    return jsonResponse(
      { id: user.id, email: user.email, emailVerified: user.emailVerified, isAdmin: user.isAdmin, createdAt: user.createdAt },
      { headers: { 'set-cookie': sessionCookie(sessionToken, expiresAt) } },
    )
  } catch (err) {
    console.error('auth-reset-password error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
