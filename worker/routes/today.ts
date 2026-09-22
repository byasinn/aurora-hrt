import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { medications, doseLogs, profile } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { dueMedicationsForDate, dateStrInTimezone } from '../../shared/scheduling'
import type { Env } from '../env'

const GRACE_HOURS = 3

const app = new Hono<{ Bindings: Env }>()

app.all('/api/today', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const url = new URL(req.url)
    const dateParam = url.searchParams.get('date')

    const [[profileRow], allMeds, dayLogs] = await Promise.all([
      db.select().from(profile).where(eq(profile.userId, user.id)).limit(1),
      db.select().from(medications).where(eq(medications.userId, user.id)),
      db.select().from(doseLogs).where(eq(doseLogs.userId, user.id)),
    ])
    const timeZone = profileRow?.timezone ?? 'America/Sao_Paulo'
    const dateStr = dateParam ?? dateStrInTimezone(new Date(), timeZone)

    const activeMeds = allMeds.filter((m) => m.active)
    const due = dueMedicationsForDate(activeMeds, dateStr, timeZone)

    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)
    const relevantLogs = dayLogs.filter((l) => {
      const t = new Date(l.scheduledFor).getTime()
      return t >= startOfDay.getTime() - 86_400_000 && t <= endOfDay.getTime() + 86_400_000
    })

    const now = Date.now()
    // um medicamento pode ter mais de um horário no mesmo dia agora — não dá mais pra casar um log
    // com "qualquer log desse remédio nesse dia" (isso juntaria os dois horários no mesmo log).
    // Casa pelo instante exato, e cada log só pode ser usado por um item (evita um log velho/duplicado
    // sendo reaproveitado em dois horários diferentes).
    const usedLogIds = new Set<number>()
    const items = due.map(({ medication, scheduledFor }) => {
      const log = relevantLogs.find(
        (l) =>
          !usedLogIds.has(l.id) &&
          l.medicationId === medication.id &&
          new Date(l.scheduledFor).getTime() === scheduledFor.getTime(),
      )
      if (log) usedLogIds.add(log.id)
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
})

export default app
