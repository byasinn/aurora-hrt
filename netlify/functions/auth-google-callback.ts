import type { Context } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { users } from '../../shared/schema'
import { createSession, sessionCookie } from './_shared/auth'
import { siteUrlFromRequest } from './_shared/email'

function redirectHome(siteUrl: string, error?: string): Response {
  const location = error ? `${siteUrl}/?authError=${encodeURIComponent(error)}` : `${siteUrl}/`
  return new Response(null, { status: 302, headers: { location } })
}

export default async (req: Request, _context: Context) => {
  const siteUrl = siteUrlFromRequest(req)
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return redirectHome(siteUrl, 'google_not_configured')
  }

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieMatch = (req.headers.get('cookie') ?? '').match(/(?:^|;\s*)oauth_state=([^;]+)/)
  const expectedState = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null

  if (!code || !state || !expectedState || state !== expectedState) {
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
    if (!tokenRes.ok) return redirectHome(siteUrl, 'google_token_exchange_failed')
    const tokenData = (await tokenRes.json()) as { access_token?: string }
    if (!tokenData.access_token) return redirectHome(siteUrl, 'google_token_exchange_failed')

    const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    if (!profileRes.ok) return redirectHome(siteUrl, 'google_profile_failed')
    const profile = (await profileRes.json()) as { sub: string; email?: string; email_verified?: boolean }

    const email = profile.email?.trim().toLowerCase()
    if (!email || !profile.email_verified) return redirectHome(siteUrl, 'google_email_not_verified')

    const db = getDb()
    let [user] = await db.select().from(users).where(eq(users.googleId, profile.sub)).limit(1)

    if (!user) {
      const [existingByEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1)
      if (existingByEmail) {
        ;[user] = await db
          .update(users)
          .set({ googleId: profile.sub, emailVerified: true })
          .where(eq(users.id, existingByEmail.id))
          .returning()
      } else {
        ;[user] = await db
          .insert(users)
          .values({ email, googleId: profile.sub, emailVerified: true })
          .returning()
      }
    }

    if (user.banned) return redirectHome(siteUrl, 'banned')

    const { token, expiresAt } = await createSession(db, user.id)
    return new Response(null, {
      status: 302,
      headers: { location: `${siteUrl}/`, 'set-cookie': sessionCookie(token, expiresAt) },
    })
  } catch (err) {
    console.error('auth-google-callback error', err)
    return redirectHome(siteUrl, 'unknown_error')
  }
}
