import { buildPushPayload, type PushSubscription as WebPushSubscription, type VapidKeys } from '@block65/webcrypto-web-push'
import { eq } from 'drizzle-orm'
import { pushSubscriptions } from '../../shared/schema'
import type { getDb } from './db'
import type { Env } from '../env'

export interface PushPayload {
  title: string
  body: string
  url?: string
}

function vapidFromEnv(env: Env): VapidKeys | null {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
    console.error('VAPID env vars não configuradas — pulando envio de push')
    return null
  }
  return { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY }
}

/** Manda push pra todas as subscriptions de um usuário; limpa as que estiverem expiradas (404/410). */
export async function sendPushToUser(
  db: ReturnType<typeof getDb>,
  env: Env,
  userId: number,
  payload: PushPayload,
): Promise<void> {
  const vapid = vapidFromEnv(env)
  if (!vapid) return

  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId))
  if (subs.length === 0) return

  const data = JSON.stringify({ ...payload, url: payload.url ?? '/' })

  await Promise.all(
    subs.map(async (sub) => {
      const subscription: WebPushSubscription = {
        endpoint: sub.endpoint,
        expirationTime: null,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      }
      try {
        const request = await buildPushPayload({ data, options: { ttl: 60 } }, subscription, vapid)
        const res = await fetch(subscription.endpoint, request)
        if (res.status === 404 || res.status === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id))
        } else if (!res.ok) {
          console.error('Falha ao enviar push', res.status, await res.text().catch(() => ''))
        }
      } catch (err) {
        console.error('Falha ao enviar push', err)
      }
    }),
  )
}
