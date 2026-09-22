import { Hono } from 'hono'
import { eq, and, gt } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { users, emailTokens } from '../../shared/schema'
import { jsonResponse, randomToken } from '../shared/auth'
import { sendEmail, siteUrlFromRequest } from '../shared/email'
import { emailQuotaExceeded, EMAIL_QUOTA_MESSAGE } from '../shared/emailQuota'
import type { Env } from '../env'

const TOKEN_HOURS = 24
const RESEND_COOLDOWN_MS = 60 * 1000
const GENERIC_MESSAGE = { ok: true, message: 'Se essa conta existir e ainda não tiver sido confirmada, reenviamos o email.' }

const app = new Hono<{ Bindings: Env }>()

app.all('/api/auth-resend-verification', async (c) => {
  const req = c.req.raw
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const { email } = (await req.json()) as { email?: string }
    const normalized = email?.trim().toLowerCase() ?? ''
    if (!normalized) return jsonResponse(GENERIC_MESSAGE)

    const db = getDb(c.env)
    // checa a cota ANTES de saber se a conta existe — não muda o comportamento de "sempre a mesma
    // resposta" que evita descobrir por tentativa se um email tem conta ou não.
    if (await emailQuotaExceeded(db)) {
      return jsonResponse({ error: EMAIL_QUOTA_MESSAGE }, { status: 503 })
    }

    const [user] = await db.select().from(users).where(eq(users.email, normalized)).limit(1)

    if (user && !user.emailVerified) {
      const [recent] = await db
        .select({ id: emailTokens.id })
        .from(emailTokens)
        .where(
          and(
            eq(emailTokens.userId, user.id),
            eq(emailTokens.type, 'verify_email'),
            gt(emailTokens.createdAt, new Date(Date.now() - RESEND_COOLDOWN_MS)),
          ),
        )
        .limit(1)
      if (recent) return jsonResponse(GENERIC_MESSAGE)

      await db
        .delete(emailTokens)
        .where(and(eq(emailTokens.userId, user.id), eq(emailTokens.type, 'verify_email')))
      const token = randomToken()
      const expiresAt = new Date(Date.now() + TOKEN_HOURS * 60 * 60 * 1000)
      await db.insert(emailTokens).values({ userId: user.id, token, type: 'verify_email', expiresAt })
      const link = `${siteUrlFromRequest(req)}/verify-email?token=${token}`
      await sendEmail(
        {
          to: normalized,
          subject: 'Confirme seu email — Aurora',
          html: `<p>Confirme seu email pra ativar sua conta na Aurora.</p><p><a href="${link}">${link}</a></p><p>Esse link expira em 24 horas.</p>`,
        },
        c.env,
      )
    }

    return jsonResponse(GENERIC_MESSAGE)
  } catch (err) {
    console.error('auth-resend-verification error', err)
    return jsonResponse(GENERIC_MESSAGE)
  }
})

export default app
