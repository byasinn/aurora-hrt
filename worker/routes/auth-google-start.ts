import { Hono } from 'hono'
import { buildCookie, randomToken } from '../shared/auth'
import { siteUrlFromRequest } from '../shared/email'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/auth-google-start', async (c) => {
  const req = c.req.raw
  const clientId = c.env.GOOGLE_CLIENT_ID
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
      'set-cookie': buildCookie('oauth_state', state, { maxAgeSeconds: 600, secure: c.env.ENVIRONMENT !== 'development' }),
    },
  })
})

export default app
