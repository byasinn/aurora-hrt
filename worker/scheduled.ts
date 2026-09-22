import { and, eq, lt } from 'drizzle-orm'
import { getDb } from './shared/db'
import { medications, profile, pushSubscriptions, rateLimitHits } from '../shared/schema'
import { dueMedicationsForDate, dateStrInTimezone } from '../shared/scheduling'
import { sendPushToUser } from './shared/push'
import type { Env } from './env'

const WINDOW_MINUTES = 15

/** Roda a cada 15min (wrangler.toml [triggers]) — lembretes de dose de remédio. */
export async function runScheduledReminders(env: Env): Promise<void> {
  const db = getDb(env)

  await db.delete(rateLimitHits).where(lt(rateLimitHits.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))

  const subscriptions = await db.select().from(pushSubscriptions)
  if (subscriptions.length === 0) {
    console.log('scheduled-reminders: nenhuma subscription, nada a fazer')
    return
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

  for (const userId of subsByUser.keys()) {
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
      await sendPushToUser(db, env, userId, {
        title: 'Hora do medicamento',
        body: `${medication.name} — ${medication.doseAmount}${medication.doseUnit}`,
        url: '/',
      })
    }

    totalNotified += toNotify.length
  }

  console.log(`scheduled-reminders: notified ${totalNotified} medication reminder(s) across ${subsByUser.size} user(s)`)
}
