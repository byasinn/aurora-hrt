import type { Context } from '@netlify/functions'
import { eq, and, gt } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { emailTokens, users } from '../../shared/schema'
import { createSession, jsonResponse, sessionCookie } from './_shared/auth'

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const { token } = (await req.json()) as { token?: string }
    if (!token) return jsonResponse({ error: 'Token ausente.' }, { status: 400 })

    const db = getDb()
    const [row] = await db
      .select()
      .from(emailTokens)
      .where(and(eq(emailTokens.token, token), eq(emailTokens.type, 'verify_email'), gt(emailTokens.expiresAt, new Date())))
      .limit(1)

    if (!row) {
      return jsonResponse({ error: 'Link inválido ou expirado.' }, { status: 400 })
    }

    const [user] = await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, row.userId))
      .returning()

    await db.delete(emailTokens).where(eq(emailTokens.id, row.id))

    const { token: sessionToken, expiresAt } = await createSession(db, user.id)
    return jsonResponse(
      { id: user.id, email: user.email, emailVerified: user.emailVerified, isAdmin: user.isAdmin, createdAt: user.createdAt },
      { headers: { 'set-cookie': sessionCookie(sessionToken, expiresAt) } },
    )
  } catch (err) {
    console.error('auth-verify-email error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
