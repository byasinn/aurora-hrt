import { Hono } from 'hono'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { workoutPrograms, workoutDays } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import type { WorkoutProgramDetail, WorkoutProgramInput } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/workout-programs', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  try {
    if (req.method === 'GET') {
      const programs = await db.select().from(workoutPrograms).where(eq(workoutPrograms.userId, user.id)).orderBy(workoutPrograms.createdAt)
      if (programs.length === 0) return jsonResponse([])

      const programIds = programs.map((p) => p.id)
      const days = await db
        .select()
        .from(workoutDays)
        .where(inArray(workoutDays.programId, programIds))
        .orderBy(workoutDays.sortOrder)

      const daysByProgram = new Map<number, typeof days>()
      for (const d of days) {
        if (!daysByProgram.has(d.programId)) daysByProgram.set(d.programId, [])
        daysByProgram.get(d.programId)!.push(d)
      }

      const out: WorkoutProgramDetail[] = programs.map((p) => ({ ...p, days: daysByProgram.get(p.id) ?? [] }))
      return jsonResponse(out)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as WorkoutProgramInput
      if (!body.name?.trim()) return jsonResponse({ error: 'name é obrigatório' }, { status: 400 })
      if (!body.days || body.days.length === 0) return jsonResponse({ error: 'pelo menos um dia é obrigatório' }, { status: 400 })

      const [program] = await db
        .insert(workoutPrograms)
        .values({ userId: user.id, name: body.name.trim(), icon: body.icon || 'dumbbell', templateKey: body.templateKey ?? null })
        .returning()

      const insertedDays = await db
        .insert(workoutDays)
        .values(
          body.days.map((d, i) => ({
            programId: program.id,
            name: d.name,
            daysOfWeek: d.daysOfWeek,
            exercises: d.exercises,
            sortOrder: i,
          })),
        )
        .returning()

      const result: WorkoutProgramDetail = { ...program, days: insertedDays }
      return jsonResponse(result, { status: 201 })
    }

    if (req.method === 'PUT') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const programId = Number(id)
      const [existing] = await db
        .select()
        .from(workoutPrograms)
        .where(and(eq(workoutPrograms.id, programId), eq(workoutPrograms.userId, user.id)))
        .limit(1)
      if (!existing) return jsonResponse({ error: 'programa não encontrado' }, { status: 404 })

      const body = (await req.json()) as Partial<WorkoutProgramInput>
      const fields: Partial<typeof workoutPrograms.$inferInsert> = {}
      if (body.name !== undefined) fields.name = body.name.trim()
      if (body.icon !== undefined) fields.icon = body.icon
      if (body.active !== undefined) fields.active = body.active

      const [program] =
        Object.keys(fields).length > 0
          ? await db.update(workoutPrograms).set(fields).where(eq(workoutPrograms.id, programId)).returning()
          : [existing]

      let days = await db.select().from(workoutDays).where(eq(workoutDays.programId, programId)).orderBy(workoutDays.sortOrder)

      if (body.days) {
        await db.delete(workoutDays).where(eq(workoutDays.programId, programId))
        days = await db
          .insert(workoutDays)
          .values(
            body.days.map((d, i) => ({
              programId,
              name: d.name,
              daysOfWeek: d.daysOfWeek,
              exercises: d.exercises,
              sortOrder: i,
            })),
          )
          .returning()
      }

      const result: WorkoutProgramDetail = { ...program, days }
      return jsonResponse(result)
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(workoutPrograms).where(and(eq(workoutPrograms.id, Number(id)), eq(workoutPrograms.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('workout-programs function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
