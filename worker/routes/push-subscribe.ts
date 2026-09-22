import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { pushSubscriptions } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import type { Env } from '../env'

interface WebPushSubscriptionBody {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

// o endpoint é usado depois pelo Worker pra dar fetch() direto nele (worker/shared/push.ts) — sem
// checar isso, um cliente malicioso podia mandar qualquer URL https e transformar o cron de
// lembretes num gerador de requisição pra endereço arbitrário. Lista não exaustiva dos provedores
// reais de push (Chrome/Firefox/Edge/Safari) — cobre o caso normal, não é uma allowlist perfeita.
const ALLOWED_PUSH_HOST_SUFFIXES = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'notify.windows.com', // WNS usa prefixos variáveis tipo wns2-xx1.notify.windows.com
  'push.apple.com',
]

function isPlausiblePushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint)
    if (url.protocol !== 'https:') return false
    return ALLOWED_PUSH_HOST_SUFFIXES.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}

const app = new Hono<{ Bindings: Env }>()

app.all('/api/push-subscribe', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    if (req.method === 'POST') {
      const body = (await req.json()) as WebPushSubscriptionBody
      if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
        return jsonResponse({ error: 'subscription inválida' }, { status: 400 })
      }
      if (!isPlausiblePushEndpoint(body.endpoint)) {
        return jsonResponse({ error: 'endpoint de push inválido' }, { status: 400 })
      }
      const [existing] = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, body.endpoint))

      // o mesmo endpoint (aparelho/navegador) pode ter pertencido a outra conta antes — em vez de
      // devolver os dados da subscription alheia (vazamento entre contas) e continuar mandando
      // lembrete de dose de outra pessoa pra esse aparelho, transfere a posse pra quem está logado
      // agora, que é quem realmente controla esse navegador neste momento.
      if (existing && existing.userId === user.id) return jsonResponse(existing)
      if (existing) {
        const [row] = await db
          .update(pushSubscriptions)
          .set({ userId: user.id, p256dh: body.keys.p256dh, auth: body.keys.auth })
          .where(eq(pushSubscriptions.id, existing.id))
          .returning()
        return jsonResponse(row)
      }

      const [row] = await db
        .insert(pushSubscriptions)
        .values({ userId: user.id, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url)
      const endpoint = url.searchParams.get('endpoint')
      if (!endpoint) return jsonResponse({ error: 'endpoint é obrigatório' }, { status: 400 })
      await db
        .delete(pushSubscriptions)
        .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('push-subscribe function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
