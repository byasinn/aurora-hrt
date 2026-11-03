import { buildPushPayload, type PushSubscription as WebPushSubscription, type VapidKeys } from '@block65/webcrypto-web-push'
import { eq, inArray } from 'drizzle-orm'
import { pushSubscriptions } from '../../shared/schema'
import type { getDb } from './db'
import type { Env } from '../env'

export interface PushPayload {
  title: string
  body: string
  url?: string
  /** Notificação com a mesma tag substitui a anterior no aparelho (ex: o "Você tomou?" troca o lembrete). */
  tag?: string
  /** Botões na notificação — tratados no service worker (src/sw.ts, evento notificationclick). */
  actions?: { action: string; title: string }[]
  /** Dados extras pros botões (ex: qual dose responder). */
  data?: Record<string, unknown>
}

type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect

function vapidFromEnv(env: Env): VapidKeys | null {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
    console.error('VAPID env vars não configuradas — pulando envio de push')
    return null
  }
  return { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY }
}

/**
 * Manda push pras subscriptions já carregadas; devolve os ids das que expiraram (404/410) pra quem
 * chamou apagar de uma vez só. `ttlSeconds` = quanto tempo o serviço de push segura a mensagem se o
 * aparelho estiver offline — lembrete de remédio que chega 20min atrasado ainda é útil, então o cron
 * passa um TTL maior que o padrão.
 */
export async function sendPushToSubscriptions(
  env: Env,
  subs: PushSubscriptionRow[],
  payload: PushPayload,
  ttlSeconds = 60,
): Promise<number[]> {
  const vapid = vapidFromEnv(env)
  if (!vapid || subs.length === 0) return []

  const data = JSON.stringify({ ...payload, url: payload.url ?? '/' })
  const expired: number[] = []

  await Promise.all(
    subs.map(async (sub) => {
      const subscription: WebPushSubscription = {
        endpoint: sub.endpoint,
        expirationTime: null,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      }
      try {
        const request = await buildPushPayload({ data, options: { ttl: ttlSeconds } }, subscription, vapid)
        const res = await fetch(subscription.endpoint, request)
        if (res.status === 404 || res.status === 410) {
          expired.push(sub.id)
        } else if (!res.ok) {
          console.error('Falha ao enviar push', res.status, await res.text().catch(() => ''))
        }
      } catch (err) {
        console.error('Falha ao enviar push', err)
      }
    }),
  )

  return expired
}

export async function deleteExpiredSubscriptions(db: ReturnType<typeof getDb>, ids: number[]): Promise<void> {
  if (ids.length === 0) return
  await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, ids))
}

/** Manda push pra todas as subscriptions de um usuário; limpa as que estiverem expiradas (404/410). */
export async function sendPushToUser(
  db: ReturnType<typeof getDb>,
  env: Env,
  userId: number,
  payload: PushPayload,
): Promise<void> {
  if (!vapidFromEnv(env)) return
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId))
  const expired = await sendPushToSubscriptions(env, subs, payload)
  await deleteExpiredSubscriptions(db, expired)
}
