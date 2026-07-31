import type { Context } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { users, emailTokens } from '../../shared/schema'
import { jsonResponse, randomToken } from './_shared/auth'
import { sendEmail, siteUrlFromRequest } from './_shared/email'

const TOKEN_HOURS = 1
const GENERIC_MESSAGE = { ok: true, message: 'Se esse email tiver uma conta, enviamos um link de recuperação.' }

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const { email } = (await req.json()) as { email?: string }
    const normalized = email?.trim().toLowerCase() ?? ''
    if (!normalized) return jsonResponse(GENERIC_MESSAGE)

    const db = getDb()
    const [user] = await db.select().from(users).where(eq(users.email, normalized)).limit(1)

    if (user) {
      const siteUrl = siteUrlFromRequest(req)
      if (user.passwordHash) {
        const token = randomToken()
        const expiresAt = new Date(Date.now() + TOKEN_HOURS * 60 * 60 * 1000)
        await db.insert(emailTokens).values({ userId: user.id, token, type: 'reset_password', expiresAt })
        const link = `${siteUrl}/reset-password?token=${token}`
        await sendEmail({
          to: normalized,
          subject: 'Recuperar senha — Aurora',
          html: `<p>Alguém (esperamos que você) pediu pra trocar a senha da sua conta na Aurora.</p><p><a href="${link}">${link}</a></p><p>Esse link expira em 1 hora. Se não foi você, ignore esse email.</p>`,
        })
      } else {
        await sendEmail({
          to: normalized,
          subject: 'Recuperar senha — Aurora',
          html: `<p>Sua conta na Aurora usa login com Google, não tem senha pra recuperar. É só entrar com "Continuar com Google".</p>`,
        })
      }
    }

    return jsonResponse(GENERIC_MESSAGE)
  } catch (err) {
    console.error('auth-request-reset error', err)
    return jsonResponse(GENERIC_MESSAGE)
  }
}
