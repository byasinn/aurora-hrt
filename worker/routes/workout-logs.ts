import { Hono } from 'hono'
import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { workoutLogs, workoutDays, workoutPrograms } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import type { WorkoutSessionInput } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/workout-logs', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const url = new URL(req.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  try {
    if (req.method === 'GET') {
      const conditions = [eq(workoutLogs.userId, user.id)]
      if (from) conditions.push(gte(workoutLogs.date, from))
      if (to) conditions.push(lte(workoutLogs.date, to))
      const rows = await db.select().from(workoutLogs).where(and(...conditions))
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as WorkoutSessionInput
      if (!body.workoutDayId || !body.date) {
        return jsonResponse({ error: 'workoutDayId e date são obrigatórios' }, { status: 400 })
      }

      const [owned] = await db
        .select({ id: workoutDays.id })
        .from(workoutDays)
        .innerJoin(workoutPrograms, eq(workoutDays.programId, workoutPrograms.id))
        .where(and(eq(workoutDays.id, body.workoutDayId), eq(workoutPrograms.userId, user.id)))
        .limit(1)
      if (!owned) return jsonResponse({ error: 'dia de treino não encontrado' }, { status: 404 })

      const values = {
        userId: user.id,
        workoutDayId: body.workoutDayId,
        date: body.date,
        durationSeconds: body.durationSeconds ?? null,
        notes: body.notes ?? null,
        setLogs: body.setLogs ?? [],
      }

      const [row] = await db
        .insert(workoutLogs)
        .values(values)
        .onConflictDoUpdate({
          target: [workoutLogs.workoutDayId, workoutLogs.date],
          set: {
            durationSeconds: values.durationSeconds,
            notes: values.notes,
            setLogs: values.setLogs,
            completedAt: new Date(),
          },
        })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'DELETE') {
      const workoutDayId = Number(url.searchParams.get('workoutDayId'))
      const date = url.searchParams.get('date')
      if (!workoutDayId || !date) {
        return jsonResponse({ error: 'workoutDayId e date são obrigatórios' }, { status: 400 })
      }
      await db
        .delete(workoutLogs)
        .where(and(eq(workoutLogs.userId, user.id), eq(workoutLogs.workoutDayId, workoutDayId), eq(workoutLogs.date, date)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('workout-logs function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
