import type { Context } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { pushSubscriptions } from '../../shared/schema'
import { checkAuth, jsonResponse } from './_shared/auth'

interface WebPushSubscriptionBody {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export default async (req: Request, _context: Context) => {
  const authError = checkAuth(req)
  if (authError) return authError

  const db = getDb()

  try {
    if (req.method === 'POST') {
      const body = (await req.json()) as WebPushSubscriptionBody
      if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
        return jsonResponse({ error: 'subscription inválida' }, { status: 400 })
      }
      const [existing] = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, body.endpoint))
      if (existing) return jsonResponse(existing)

      const [row] = await db
        .insert(pushSubscriptions)
        .values({ endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url)
      const endpoint = url.searchParams.get('endpoint')
      if (!endpoint) return jsonResponse({ error: 'endpoint é obrigatório' }, { status: 400 })
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('push-subscribe function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
