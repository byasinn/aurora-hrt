import { Hono } from 'hono'
import { and, eq, isNull, or } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { tags } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import type { TagInput } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/tags', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
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
      // upsert por (userId, type, label) — clicar rápido demais numa sugestão antes dela sumir da
      // lista (ou duas abas abertas) chamava POST duas vezes pro mesmo label; agora a segunda
      // chamada só devolve a tag que já existe, em vez de criar uma duplicata.
      const [row] = await db
        .insert(tags)
        .values({ ...body, userId: user.id, isCustom: true })
        .onConflictDoUpdate({
          target: [tags.userId, tags.type, tags.label],
          set: { emoji: body.emoji ?? null, color: body.color ?? null },
        })
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
})

export default app
