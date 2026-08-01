import type { Context } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { users, emailTokens } from '../../shared/schema'
import { hashPassword, jsonResponse, randomToken } from './_shared/auth'
import { sendEmail, siteUrlFromRequest } from './_shared/email'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOKEN_HOURS = 24

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const body = (await req.json()) as { email?: string; password?: string }
    const email = body.email?.trim().toLowerCase() ?? ''
    const password = body.password ?? ''

    if (!EMAIL_RE.test(email)) {
      return jsonResponse({ error: 'Email inválido.' }, { status: 400 })
    }
    if (password.length < 8) {
      return jsonResponse({ error: 'Senha precisa ter pelo menos 8 caracteres.' }, { status: 400 })
    }
    const db = getDb()
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existing) {
      return jsonResponse({ error: 'Já existe uma conta com esse email.' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const [user] = await db.insert(users).values({ email, passwordHash, emailVerified: false }).returning()

    const token = randomToken()
    const expiresAt = new Date(Date.now() + TOKEN_HOURS * 60 * 60 * 1000)
    await db.insert(emailTokens).values({ userId: user.id, token, type: 'verify_email', expiresAt })

    const link = `${siteUrlFromRequest(req)}/verify-email?token=${token}`
    await sendEmail({
      to: email,
      subject: 'Confirme seu email — Aurora',
      html: `<p>Falta pouco! Confirme seu email pra ativar sua conta na Aurora.</p><p><a href="${link}">${link}</a></p><p>Esse link expira em 24 horas.</p>`,
    })

    return jsonResponse({ ok: true, message: 'Cadastro criado. Verifique seu email para confirmar.' }, { status: 201 })
  } catch (err) {
    console.error('auth-signup error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
