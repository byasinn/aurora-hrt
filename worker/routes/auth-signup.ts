import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { users, emailTokens } from '../../shared/schema'
import { hashPassword, jsonResponse, randomToken } from '../shared/auth'
import { sendEmail, siteUrlFromRequest } from '../shared/email'
import { isRateLimited, clientIp } from '../shared/rateLimit'
import { emailQuotaExceeded, EMAIL_QUOTA_MESSAGE } from '../shared/emailQuota'
import type { Env } from '../env'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOKEN_HOURS = 24
const SIGNUP_WINDOW_MS = 60 * 60 * 1000
const SIGNUP_MAX_PER_IP = 5

const app = new Hono<{ Bindings: Env }>()

app.all('/api/auth-signup', async (c) => {
  const req = c.req.raw
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const db = getDb(c.env)
    const ip = clientIp(req)
    if (await isRateLimited(db, `signup:${ip}`, SIGNUP_WINDOW_MS, SIGNUP_MAX_PER_IP)) {
      return jsonResponse({ error: 'Muitos cadastros por aqui. Tente de novo mais tarde.' }, { status: 429 })
    }

    const body = (await req.json()) as { email?: string; password?: string; termsAccepted?: boolean; ageConfirmed?: boolean }
    const email = body.email?.trim().toLowerCase() ?? ''
    const password = body.password ?? ''

    if (!EMAIL_RE.test(email)) {
      return jsonResponse({ error: 'Email inválido.' }, { status: 400 })
    }
    if (password.length < 8) {
      return jsonResponse({ error: 'Senha precisa ter pelo menos 8 caracteres.' }, { status: 400 })
    }
    if (body.termsAccepted !== true) {
      return jsonResponse({ error: 'É preciso aceitar os Termos de Uso e a Política de Privacidade.' }, { status: 400 })
    }
    if (body.ageConfirmed !== true) {
      return jsonResponse({ error: 'É preciso confirmar que você tem 18 anos ou mais.' }, { status: 400 })
    }
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existing) {
      return jsonResponse({ error: 'Já existe uma conta com esse email.' }, { status: 409 })
    }

    // checa a cota de email ANTES de criar a conta — sem isso a pessoa fica com uma conta criada,
    // mas sem confirmação nenhuma chegando, presa sem saber por quê (login com Google não passa por
    // aqui, então não é afetado).
    if (await emailQuotaExceeded(db)) {
      return jsonResponse({ error: EMAIL_QUOTA_MESSAGE }, { status: 503 })
    }

    const passwordHash = await hashPassword(password)
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, emailVerified: false, termsAcceptedAt: new Date(), ageConfirmedAt: new Date() })
      .returning()

    const token = randomToken()
    const expiresAt = new Date(Date.now() + TOKEN_HOURS * 60 * 60 * 1000)
    await db.insert(emailTokens).values({ userId: user.id, token, type: 'verify_email', expiresAt })

    const link = `${siteUrlFromRequest(req)}/verify-email?token=${token}`
    const sent = await sendEmail(
      {
        to: email,
        subject: 'Confirme seu email — Aurora',
        html: `<p>Falta pouco! Confirme seu email pra ativar sua conta na Aurora.</p><p><a href="${link}">${link}</a></p><p>Esse link expira em 24 horas.</p>`,
      },
      c.env,
    )

    const message = sent
      ? 'Cadastro criado. Verifique seu email para confirmar.'
      : 'Cadastro criado, mas não conseguimos confirmar o envio do email agora. Se não chegar em alguns minutos, use "Reenviar email de confirmação" na tela de login.'
    return jsonResponse({ ok: true, message }, { status: 201 })
  } catch (err) {
    console.error('auth-signup error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
