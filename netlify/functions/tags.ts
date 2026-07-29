import type { Context } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { getDb } from './_db'
import { tags } from '../../shared/schema'
import { checkAuth, jsonResponse } from './_auth'
import type { TagInput } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const authError = checkAuth(req)
  if (authError) return authError

  const db = getDb()
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const type = url.searchParams.get('type')

  try {
    if (req.method === 'GET') {
      const rows = type
        ? await db.select().from(tags).where(eq(tags.type, type))
        : await db.select().from(tags)
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as TagInput
      const [row] = await db.insert(tags).values({ ...body, isCustom: true }).returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(tags).where(eq(tags.id, Number(id)))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('tags function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
