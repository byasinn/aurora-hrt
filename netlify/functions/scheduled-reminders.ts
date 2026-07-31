import type { Config } from '@netlify/functions'
import webpush from 'web-push'
import { and, eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { medications, profile, pushSubscriptions } from '../../shared/schema'
import { dueMedicationsForDate, dateStrInTimezone } from './_shared/scheduling'

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

  const subscriptions = await db.select().from(pushSubscriptions)
  if (subscriptions.length === 0) {
    return new Response('no subscriptions', { status: 200 })
  }

  const subsByUser = new Map<number, typeof subscriptions>()
  for (const sub of subscriptions) {
    if (sub.userId == null) continue
    const list = subsByUser.get(sub.userId) ?? []
    list.push(sub)
    subsByUser.set(sub.userId, list)
  }

  const now = new Date()
  const windowMs = WINDOW_MINUTES * 60_000
  let totalNotified = 0

  for (const [userId, userSubs] of subsByUser) {
    const [profileRow] = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1)
    const timeZone = profileRow?.timezone ?? 'America/Sao_Paulo'
    const dateStr = dateStrInTimezone(now, timeZone)

    const activeMeds = await db
      .select()
      .from(medications)
      .where(and(eq(medications.userId, userId), eq(medications.active, true), eq(medications.remindersEnabled, true)))
    const due = dueMedicationsForDate(activeMeds, dateStr, timeZone)

    const toNotify = due.filter(({ scheduledFor }) => {
      const diff = now.getTime() - scheduledFor.getTime()
      return diff >= 0 && diff < windowMs
    })

    if (toNotify.length === 0) continue

    for (const { medication } of toNotify) {
      const payload = JSON.stringify({
        title: 'Hora do medicamento',
        body: `${medication.name} — ${medication.doseAmount}${medication.doseUnit}`,
        medicationId: medication.id,
        url: '/',
      })

      await Promise.all(
        userSubs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
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

    totalNotified += toNotify.length
  }

  return new Response(`notified ${totalNotified} medication reminder(s) across ${subsByUser.size} user(s)`, {
    status: 200,
  })
}

export const config: Config = {
  schedule: `*/${WINDOW_MINUTES} * * * *`,
}
