import type { Context } from '@netlify/functions'
import { eq, and } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { medications, doseLogs, profile } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import type { MedicationInput } from '../../shared/types'
import { isDueOnDate, scheduledInstantFor, dateStrInTimezone } from './_shared/scheduling'

async function backfillDoseLogs(
  db: ReturnType<typeof getDb>,
  userId: number,
  medicationId: number,
  medication: MedicationInput,
  fromDateStr: string,
  timeZone: string,
) {
  const today = dateStrInTimezone(new Date(), timeZone)
  const cursor = new Date(`${fromDateStr}T00:00:00Z`)
  const rows: (typeof doseLogs.$inferInsert)[] = []

  while (dateStrInTimezone(cursor, timeZone) < today) {
    const dateStr = dateStrInTimezone(cursor, timeZone)
    if (isDueOnDate(medication, dateStr, timeZone)) {
      const scheduledFor = scheduledInstantFor(medication, dateStr, timeZone)
      rows.push({
        userId,
        medicationId,
        scheduledFor,
        takenAt: scheduledFor,
        status: 'taken',
      })
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  if (rows.length > 0) {
    await db.insert(doseLogs).values(rows)
  }
  return rows.length
}

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  try {
    if (req.method === 'GET') {
      const rows = await db
        .select()
        .from(medications)
        .where(eq(medications.userId, user.id))
        .orderBy(medications.createdAt)
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const { backfillFrom, ...body } = (await req.json()) as MedicationInput & {
        backfillFrom?: string
      }
      const [row] = await db
        .insert(medications)
        .values({ ...body, userId: user.id })
        .returning()

      let backfilled = 0
      if (backfillFrom) {
        const [profileRow] = await db.select().from(profile).where(eq(profile.userId, user.id)).limit(1)
        const timeZone = profileRow?.timezone ?? 'America/Sao_Paulo'
        backfilled = await backfillDoseLogs(db, user.id, row.id, body, backfillFrom, timeZone)
      }

      return jsonResponse({ ...row, backfilled }, { status: 201 })
    }

    if (req.method === 'PUT') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const body = (await req.json()) as Partial<MedicationInput>
      const [row] = await db
        .update(medications)
        .set(body)
        .where(and(eq(medications.id, Number(id)), eq(medications.userId, user.id)))
        .returning()
      return jsonResponse(row)
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(medications).where(and(eq(medications.id, Number(id)), eq(medications.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('medications function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
