import type { Context } from '@netlify/functions'
import { eq, and } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { users, emailTokens } from '../../shared/schema'
import { jsonResponse, randomToken } from './_shared/auth'
import { sendEmail, siteUrlFromRequest } from './_shared/email'

const TOKEN_HOURS = 24
const GENERIC_MESSAGE = { ok: true, message: 'Se essa conta existir e ainda não tiver sido confirmada, reenviamos o email.' }

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const { email } = (await req.json()) as { email?: string }
    const normalized = email?.trim().toLowerCase() ?? ''
    if (!normalized) return jsonResponse(GENERIC_MESSAGE)

    const db = getDb()
    const [user] = await db.select().from(users).where(eq(users.email, normalized)).limit(1)

    if (user && !user.emailVerified) {
      await db
        .delete(emailTokens)
        .where(and(eq(emailTokens.userId, user.id), eq(emailTokens.type, 'verify_email')))
      const token = randomToken()
      const expiresAt = new Date(Date.now() + TOKEN_HOURS * 60 * 60 * 1000)
      await db.insert(emailTokens).values({ userId: user.id, token, type: 'verify_email', expiresAt })
      const link = `${siteUrlFromRequest(req)}/verify-email?token=${token}`
      await sendEmail({
        to: normalized,
        subject: 'Confirme seu email — Aurora',
        html: `<p>Confirme seu email pra ativar sua conta na Aurora.</p><p><a href="${link}">${link}</a></p><p>Esse link expira em 24 horas.</p>`,
      })
    }

    return jsonResponse(GENERIC_MESSAGE)
  } catch (err) {
    console.error('auth-resend-verification error', err)
    return jsonResponse(GENERIC_MESSAGE)
  }
}
