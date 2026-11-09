import { Hono } from 'hono'
import { and, count, eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { routines } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { stripOwnerFields } from '../shared/contentLimits'
import { MAX_ROUTINES } from '../../shared/points'
import type { RoutineInput } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/routines', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  try {
    if (req.method === 'GET') {
      const rows = await db
        .select()
        .from(routines)
        .where(eq(routines.userId, user.id))
        .orderBy(routines.createdAt)
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as RoutineInput
      // teto de rotinas: criar e apagar não dá Brilho, mas sem limite dava pra encher o dia de rotina boba
      const [{ value: existing }] = await db.select({ value: count() }).from(routines).where(eq(routines.userId, user.id))
      if (existing >= MAX_ROUTINES) {
        return jsonResponse({ error: `você já tem ${MAX_ROUTINES} rotinas — apague uma pra criar outra` }, { status: 400 })
      }
      const [row] = await db
        .insert(routines)
        .values({ ...body, userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'PUT') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const body = (await req.json()) as Partial<RoutineInput>
      const [row] = await db
        .update(routines)
        .set(stripOwnerFields(body))
        .where(and(eq(routines.id, Number(id)), eq(routines.userId, user.id)))
        .returning()
      return jsonResponse(row)
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(routines).where(and(eq(routines.id, Number(id)), eq(routines.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('routines function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
