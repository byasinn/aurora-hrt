import { Hono } from 'hono'
import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { doseLogs, medications, profile } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { stripOwnerFields } from '../shared/contentLimits'
import { dateStrInTimezone } from '../../shared/scheduling'
import { isLate } from '../../shared/points'
import type { DoseLogInput } from '../../shared/types'
import type { Env } from '../env'

function coerceDates<T extends Record<string, unknown>>(body: T): T {
  const out = { ...body }
  for (const key of ['scheduledFor', 'takenAt'] as const) {
    const value = out[key]
    if (typeof value === 'string') (out as Record<string, unknown>)[key] = new Date(value)
  }
  return out
}

/** Dose marcada como tomada depois do dia dela (com a folga da madrugada) fica no histórico mas não
 * vale Brilho — quem decide é o servidor, não o app. `requested` true (preenchimento de histórico ao
 * cadastrar o remédio) continua true. */
async function backfilledFor(db: ReturnType<typeof getDb>, userId: number, scheduledFor: Date, status: string | undefined, requested?: boolean | null) {
  if (requested) return true
  if (status !== 'taken') return false
  const [prof] = await db.select({ timezone: profile.timezone }).from(profile).where(eq(profile.userId, userId)).limit(1)
  const tz = prof?.timezone ?? 'America/Sao_Paulo'
  return isLate(dateStrInTimezone(scheduledFor, tz), new Date(), tz)
}

const app = new Hono<{ Bindings: Env }>()

// Resposta dos botões "Tomei"/"Pulei hoje" da notificação de "Você tomou?" (src/sw.ts) — vem do
// service worker, que não sabe se a dose já tem log, então isso aqui atualiza o existente ou cria.
app.post('/api/doses/respond', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    const body = (await req.json()) as { medicationId?: number; scheduledFor?: string; status?: string }
    if (typeof body.medicationId !== 'number' || !body.scheduledFor || (body.status !== 'taken' && body.status !== 'skipped')) {
      return jsonResponse({ error: 'medicationId, scheduledFor e status (taken|skipped) são obrigatórios' }, { status: 400 })
    }
    const scheduledFor = new Date(body.scheduledFor)
    if (Number.isNaN(scheduledFor.getTime())) return jsonResponse({ error: 'scheduledFor inválido' }, { status: 400 })

    const [med] = await db
      .select({ id: medications.id })
      .from(medications)
      .where(and(eq(medications.id, body.medicationId), eq(medications.userId, user.id)))
      .limit(1)
    if (!med) return jsonResponse({ error: 'medicamento não encontrado' }, { status: 404 })

    const takenAt = body.status === 'taken' ? new Date() : null
    const [existing] = await db
      .select({ id: doseLogs.id })
      .from(doseLogs)
      .where(and(eq(doseLogs.userId, user.id), eq(doseLogs.medicationId, med.id), eq(doseLogs.scheduledFor, scheduledFor)))
      .limit(1)

    const backfilled = await backfilledFor(db, user.id, scheduledFor, body.status)
    const [row] = existing
      ? await db.update(doseLogs).set({ status: body.status, takenAt, backfilled }).where(eq(doseLogs.id, existing.id)).returning()
      : await db
          .insert(doseLogs)
          .values({ userId: user.id, medicationId: med.id, scheduledFor, status: body.status, takenAt, backfilled })
          .returning()
    return jsonResponse(row)
  } catch (err) {
    console.error('doses respond error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

app.all('/api/doses', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const medicationId = url.searchParams.get('medicationId')

  try {
    if (req.method === 'GET') {
      const conditions = [eq(doseLogs.userId, user.id)]
      if (from) conditions.push(gte(doseLogs.scheduledFor, new Date(from)))
      if (to) conditions.push(lte(doseLogs.scheduledFor, new Date(to)))
      if (medicationId) conditions.push(eq(doseLogs.medicationId, Number(medicationId)))

      const rows = await db.select().from(doseLogs).where(and(...conditions))
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = coerceDates((await req.json()) as DoseLogInput)
      if (body.medicationId != null) {
        const [med] = await db
          .select({ id: medications.id })
          .from(medications)
          .where(and(eq(medications.id, body.medicationId), eq(medications.userId, user.id)))
          .limit(1)
        if (!med) return jsonResponse({ error: 'medicamento não encontrado' }, { status: 404 })
      }
      const scheduledFor = body.scheduledFor instanceof Date ? body.scheduledFor : new Date()
      const backfilled = await backfilledFor(db, user.id, scheduledFor, body.status, body.backfilled)
      const [row] = await db
        .insert(doseLogs)
        .values({ ...body, backfilled, userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'PUT') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const body = coerceDates((await req.json()) as Partial<DoseLogInput>)
      if (body.medicationId != null) {
        const [med] = await db
          .select({ id: medications.id })
          .from(medications)
          .where(and(eq(medications.id, body.medicationId), eq(medications.userId, user.id)))
          .limit(1)
        if (!med) return jsonResponse({ error: 'medicamento não encontrado' }, { status: 404 })
      }
      const patch = stripOwnerFields(body)
      if (body.status !== undefined) {
        const [current] = await db
          .select({ scheduledFor: doseLogs.scheduledFor, backfilled: doseLogs.backfilled, status: doseLogs.status })
          .from(doseLogs)
          .where(and(eq(doseLogs.id, Number(id)), eq(doseLogs.userId, user.id)))
          .limit(1)
        // status igual (editou só nota/horário) mantém o que já era; mudou pra tomada agora, decide de novo
        if (current && current.status === body.status) patch.backfilled = current.backfilled
        else if (current) patch.backfilled = await backfilledFor(db, user.id, current.scheduledFor, body.status, current.backfilled && body.status === 'taken')
      } else {
        delete patch.backfilled
      }
      const [row] = await db
        .update(doseLogs)
        .set(patch)
        .where(and(eq(doseLogs.id, Number(id)), eq(doseLogs.userId, user.id)))
        .returning()
      return jsonResponse(row)
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(doseLogs).where(and(eq(doseLogs.id, Number(id)), eq(doseLogs.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('doses function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
