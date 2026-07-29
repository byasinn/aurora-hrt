import type { Config } from '@netlify/functions'
import webpush from 'web-push'
import { eq } from 'drizzle-orm'
import { getDb } from './_db'
import { medications, profile, pushSubscriptions } from '../../shared/schema'
import { dueMedicationsForDate, dateStrInTimezone } from './_scheduling'

const WINDOW_MINUTES = 15

export default async () => {
  const db = getDb()

  const vapidPublic = process.env.VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT
  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    console.error('VAPID env vars não configuradas — pulando envio de lembretes')
    return new Response('missing vapid config', { status: 500 })
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const [profileRow] = await db.select().from(profile).limit(1)
  const timeZone = profileRow?.timezone ?? 'America/Sao_Paulo'
  const now = new Date()
  const dateStr = dateStrInTimezone(now, timeZone)

  const activeMeds = await db.select().from(medications).where(eq(medications.active, true))
  const due = dueMedicationsForDate(activeMeds, dateStr, timeZone)

  const windowMs = WINDOW_MINUTES * 60_000
  const toNotify = due.filter(({ scheduledFor }) => {
    const diff = now.getTime() - scheduledFor.getTime()
    return diff >= 0 && diff < windowMs
  })

  if (toNotify.length === 0) {
    return new Response('nothing due', { status: 200 })
  }

  const subscriptions = await db.select().from(pushSubscriptions)
  if (subscriptions.length === 0) {
    console.warn('Nenhuma push subscription registrada — nada para notificar')
    return new Response('no subscriptions', { status: 200 })
  }

  for (const { medication } of toNotify) {
    const payload = JSON.stringify({
      title: 'Hora do medicamento',
      body: `${medication.name} — ${medication.doseAmount}${medication.doseUnit}`,
      medicationId: medication.id,
      url: '/',
    })

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
          )
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode
          if (statusCode === 404 || statusCode === 410) {
            // Subscription expirada/inválida — remove para não tentar de novo.
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id))
          } else {
            console.error('Falha ao enviar push', err)
          }
        }
      }),
    )
  }

  return new Response(`notified ${toNotify.length} medication(s)`, { status: 200 })
}

export const config: Config = {
  schedule: `*/${WINDOW_MINUTES} * * * *`,
}
