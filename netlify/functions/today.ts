import type { Context } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { medications, doseLogs, profile } from '../../shared/schema'
import { checkAuth, jsonResponse } from './_shared/auth'
import { dueMedicationsForDate, dateStrInTimezone } from './_shared/scheduling'

const GRACE_HOURS = 3

export default async (req: Request, _context: Context) => {
  const authError = checkAuth(req)
  if (authError) return authError
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const db = getDb()
    const url = new URL(req.url)
    const dateParam = url.searchParams.get('date')

    const [profileRow] = await db.select().from(profile).limit(1)
    const timeZone = profileRow?.timezone ?? 'America/Sao_Paulo'
    const dateStr = dateParam ?? dateStrInTimezone(new Date(), timeZone)

    const allMeds = await db.select().from(medications).where(eq(medications.active, true))
    const due = dueMedicationsForDate(allMeds, dateStr, timeZone)

    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)
    const dayLogs = await db.select().from(doseLogs)
    const relevantLogs = dayLogs.filter((l) => {
      const t = new Date(l.scheduledFor).getTime()
      return t >= startOfDay.getTime() - 86_400_000 && t <= endOfDay.getTime() + 86_400_000
    })

    const now = Date.now()
    const items = due.map(({ medication, scheduledFor }) => {
      const log = relevantLogs.find(
        (l) =>
          l.medicationId === medication.id &&
          dateStrInTimezone(new Date(l.scheduledFor), timeZone) === dateStr,
      )
      let status: 'pending' | 'taken' | 'skipped' | 'missed' = 'pending'
      if (log) {
        status = log.status as typeof status
      } else if (now - scheduledFor.getTime() > GRACE_HOURS * 3_600_000) {
        status = 'missed'
      }
      return {
        medication,
        scheduledFor: scheduledFor.toISOString(),
        doseLogId: log?.id ?? null,
        status,
      }
    })

    items.sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
    return jsonResponse({ date: dateStr, timeZone, items })
  } catch (err) {
    console.error('today function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
