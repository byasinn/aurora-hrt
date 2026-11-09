import { Hono } from 'hono'
import { and, eq, gt } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { emailTokens, sessions, users } from '../../shared/schema'
import { createSession, hashPassword, jsonResponse, randomToken, requireUser, sessionCookie, verifyPassword } from '../shared/auth'
import { sendEmail, siteUrlFromRequest } from '../shared/email'
import { emailQuotaExceeded, EMAIL_QUOTA_MESSAGE } from '../shared/emailQuota'
import { isRateLimited } from '../shared/rateLimit'
import type { Env } from '../env'

// Troca de senha e de email pela tela de Conta (logado). Recuperação de senha esquecida continua
// em auth-request-reset / auth-reset-password.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CHANGE_EMAIL_HOURS = 24
const ACCOUNT_CHANGE_WINDOW_MS = 60 * 60 * 1000
const ACCOUNT_CHANGE_MAX = 5

const app = new Hono<{ Bindings: Env }>()

app.post('/api/auth-change-password', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth

  try {
    if (await isRateLimited(db, `change-password:${auth.user.id}`, ACCOUNT_CHANGE_WINDOW_MS, ACCOUNT_CHANGE_MAX)) {
      return jsonResponse({ error: 'Muitas tentativas. Tente de novo mais tarde.' }, { status: 429 })
    }
    const body = (await req.json()) as { currentPassword?: string; newPassword?: string }
    const newPassword = body.newPassword ?? ''
    if (newPassword.length < 8) return jsonResponse({ error: 'A senha nova precisa ter pelo menos 8 caracteres.' }, { status: 400 })

    const [user] = await db.select().from(users).where(eq(users.id, auth.user.id)).limit(1)
    // conta só com Google não tem senha ainda: pode criar uma sem informar a atual
    if (user.passwordHash) {
      const ok = await verifyPassword(body.currentPassword ?? '', user.passwordHash)
      if (!ok) return jsonResponse({ error: 'A senha atual está incorreta.' }, { status: 400 })
    }

    await db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, user.id))
    // derruba os outros logins (outro aparelho com a senha antiga) e mantém este
    await db.delete(sessions).where(eq(sessions.userId, user.id))
    const { token, expiresAt } = await createSession(db, user.id)
    return jsonResponse({ ok: true }, { headers: { 'set-cookie': sessionCookie(token, expiresAt, c.env) } })
  } catch (err) {
    console.error('auth-change-password error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

app.post('/api/auth-change-email', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth

  try {
    if (await isRateLimited(db, `change-email:${auth.user.id}`, ACCOUNT_CHANGE_WINDOW_MS, ACCOUNT_CHANGE_MAX)) {
      return jsonResponse({ error: 'Muitas tentativas. Tente de novo mais tarde.' }, { status: 429 })
    }
    const body = (await req.json()) as { newEmail?: string; password?: string }
    const newEmail = body.newEmail?.trim().toLowerCase() ?? ''
    if (!EMAIL_RE.test(newEmail)) return jsonResponse({ error: 'Email inválido.' }, { status: 400 })

    const [user] = await db.select().from(users).where(eq(users.id, auth.user.id)).limit(1)
    if (newEmail === user.email) return jsonResponse({ error: 'Esse já é o seu email.' }, { status: 400 })
    if (user.passwordHash) {
      const ok = await verifyPassword(body.password ?? '', user.passwordHash)
      if (!ok) return jsonResponse({ error: 'Senha incorreta.' }, { status: 400 })
    }
    const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, newEmail)).limit(1)
    if (taken) return jsonResponse({ error: 'Já existe uma conta com esse email.' }, { status: 409 })
    if (await emailQuotaExceeded(db)) return jsonResponse({ error: EMAIL_QUOTA_MESSAGE }, { status: 503 })

    // um pedido de troca por vez: o link antigo para de valer
    await db.delete(emailTokens).where(and(eq(emailTokens.userId, user.id), eq(emailTokens.type, 'change_email')))
    const token = randomToken()
    await db.insert(emailTokens).values({
      userId: user.id,
      token,
      type: 'change_email',
      newEmail,
      expiresAt: new Date(Date.now() + CHANGE_EMAIL_HOURS * 60 * 60 * 1000),
    })

    const link = `${siteUrlFromRequest(req)}/confirmar-email?token=${token}`
    const sent = await sendEmail(
      {
        to: newEmail,
        subject: 'Confirme seu novo email — Aurora',
        html: `<p>Pediram pra trocar o email da sua conta na Aurora pra este endereço.</p><p><a href="${link}">${link}</a></p><p>O link vale por 24 horas. Se não foi você, ignore — nada muda.</p>`,
      },
      c.env,
    )
    if (!sent) return jsonResponse({ error: 'Não conseguimos enviar o email agora. Tente de novo em alguns minutos.' }, { status: 502 })
    return jsonResponse({ ok: true, message: `Enviamos um link de confirmação pra ${newEmail}. O email só muda depois que você abrir o link.` })
  } catch (err) {
    console.error('auth-change-email error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

// abrir o link já prova que a pessoa controla o email novo — não precisa estar logada neste aparelho
app.post('/api/auth-confirm-email-change', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  try {
    const { token } = (await req.json()) as { token?: string }
    if (!token) return jsonResponse({ error: 'Token ausente.' }, { status: 400 })
    const [row] = await db
      .select()
      .from(emailTokens)
      .where(and(eq(emailTokens.token, token), eq(emailTokens.type, 'change_email'), gt(emailTokens.expiresAt, new Date())))
      .limit(1)
    if (!row?.newEmail) return jsonResponse({ error: 'Link inválido ou expirado.' }, { status: 400 })

    const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, row.newEmail)).limit(1)
    if (taken) {
      await db.delete(emailTokens).where(eq(emailTokens.id, row.id))
      return jsonResponse({ error: 'Esse email passou a ser usado por outra conta.' }, { status: 409 })
    }

    const [before] = await db.select({ email: users.email }).from(users).where(eq(users.id, row.userId)).limit(1)
    await db.update(users).set({ email: row.newEmail, emailVerified: true }).where(eq(users.id, row.userId))
    await db.delete(emailTokens).where(eq(emailTokens.id, row.id))

    // avisa o endereço antigo — se a troca não foi da pessoa, ela fica sabendo
    if (before?.email) {
      await sendEmail(
        {
          to: before.email,
          subject: 'O email da sua conta mudou — Aurora',
          html: `<p>O email da sua conta na Aurora foi trocado para <strong>${row.newEmail}</strong>.</p><p>Se não foi você, responda este email ou fale com a gente o quanto antes.</p>`,
        },
        c.env,
      )
    }
    return jsonResponse({ ok: true, email: row.newEmail })
  } catch (err) {
    console.error('auth-confirm-email-change error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
