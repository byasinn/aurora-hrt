import type { Context } from '@netlify/functions'
import { and, eq, isNull, or } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { tags } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import type { TagInput } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const type = url.searchParams.get('type')

  try {
    if (req.method === 'GET') {
      const ownershipCondition = or(isNull(tags.userId), eq(tags.userId, user.id))
      const rows = await db
        .select()
        .from(tags)
        .where(type ? and(ownershipCondition, eq(tags.type, type)) : ownershipCondition)
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as TagInput
      const [row] = await db
        .insert(tags)
        .values({ ...body, userId: user.id, isCustom: true })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(tags).where(and(eq(tags.id, Number(id)), eq(tags.userId, user.id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('tags function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
