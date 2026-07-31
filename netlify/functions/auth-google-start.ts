import type { Context } from '@netlify/functions'
import { buildCookie, randomToken } from './_shared/auth'
import { siteUrlFromRequest } from './_shared/email'

export default async (req: Request, _context: Context) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return new Response('Login com Google não está configurado.', { status: 500 })
  }

  const state = randomToken()
  const redirectUri = `${siteUrlFromRequest(req)}/api/auth-google-callback`

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('access_type', 'online')
  authUrl.searchParams.set('prompt', 'select_account')

  return new Response(null, {
    status: 302,
    headers: {
      location: authUrl.toString(),
      'set-cookie': buildCookie('oauth_state', state, { maxAgeSeconds: 600 }),
    },
  })
}
