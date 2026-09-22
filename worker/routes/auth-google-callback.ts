import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { users } from '../../shared/schema'
import { createSession, sessionCookie } from '../shared/auth'
import { siteUrlFromRequest } from '../shared/email'
import type { Env } from '../env'

function redirectHome(siteUrl: string, error?: string): Response {
  const location = error ? `${siteUrl}/?authError=${encodeURIComponent(error)}` : `${siteUrl}/`
  return new Response(null, { status: 302, headers: { location } })
}

const app = new Hono<{ Bindings: Env }>()

app.all('/api/auth-google-callback', async (c) => {
  const req = c.req.raw
  const siteUrl = siteUrlFromRequest(req)
  const clientId = c.env.GOOGLE_CLIENT_ID
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return redirectHome(siteUrl, 'google_not_configured')
  }

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieMatch = (req.headers.get('cookie') ?? '').match(/(?:^|;\s*)oauth_state=([^;]+)/)
  const expectedState = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null

  if (!code || !state || !expectedState || state !== expectedState) {
    console.error('auth-google-callback: invalid_state', { hasCode: !!code, hasState: !!state, hasExpected: !!expectedState })
    return redirectHome(siteUrl, 'invalid_state')
  }

  try {
    const redirectUri = `${siteUrl}/api/auth-google-callback`
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })
    if (!tokenRes.ok) {
      console.error('auth-google-callback: token exchange failed', tokenRes.status, await tokenRes.text().catch(() => ''))
      return redirectHome(siteUrl, 'google_token_exchange_failed')
    }
    const tokenData = (await tokenRes.json()) as { access_token?: string }
    if (!tokenData.access_token) return redirectHome(siteUrl, 'google_token_exchange_failed')

    const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    if (!profileRes.ok) {
      console.error('auth-google-callback: profile fetch failed', profileRes.status, await profileRes.text().catch(() => ''))
      return redirectHome(siteUrl, 'google_profile_failed')
    }
    const profile = (await profileRes.json()) as { sub: string; email?: string; email_verified?: boolean }

    const email = profile.email?.trim().toLowerCase()
    if (!email || !profile.email_verified) return redirectHome(siteUrl, 'google_email_not_verified')

    const db = getDb(c.env)
    let [user] = await db.select().from(users).where(eq(users.googleId, profile.sub)).limit(1)

    if (!user) {
      const [existingByEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1)
      if (existingByEmail) {
        // se a conta já tinha senha E nunca foi verificada, não dá pra saber se quem está entrando
        // com Google agora é o dono de verdade ou se ela foi pré-cadastrada por alguém que sabia o
        // email da vítima só pra ficar com uma senha válida na conta dela (sequestro de conta via
        // pré-registro). O Google já provou que essa pessoa controla o email de verdade — a resposta
        // certa é invalidar a senha antiga (não sabemos de quem é) e deixar a conta só com Google
        // daqui pra frente, fechando o acesso de quem quer que tenha criado a senha original.
        const wasUnverifiedWithPassword = !!existingByEmail.passwordHash && !existingByEmail.emailVerified
        ;[user] = await db
          .update(users)
          .set({
            googleId: profile.sub,
            emailVerified: true,
            ...(wasUnverifiedWithPassword ? { passwordHash: null } : {}),
          })
          .where(eq(users.id, existingByEmail.id))
          .returning()
      } else {
        ;[user] = await db
          .insert(users)
          .values({ email, googleId: profile.sub, emailVerified: true, termsAcceptedAt: new Date(), ageConfirmedAt: new Date() })
          .returning()
      }
    }

    if (user.banned) return redirectHome(siteUrl, 'banned')

    const { token, expiresAt } = await createSession(db, user.id)
    return new Response(null, {
      status: 302,
      headers: { location: `${siteUrl}/`, 'set-cookie': sessionCookie(token, expiresAt, c.env) },
    })
  } catch (err) {
    console.error('auth-google-callback error', err)
    return redirectHome(siteUrl, 'unknown_error')
  }
})

export default app
