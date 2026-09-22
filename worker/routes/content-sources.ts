import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { contentSources } from '../../shared/schema'
import { jsonResponse, requireAdmin } from '../shared/auth'
import { validateText } from '../shared/contentLimits'
import type { ContentSourceInput } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

// Tudo aqui é admin-only — configurar de onde vem o conteúdo automático não é algo que qualquer
// pessoa deveria poder fazer (controla o que aparece pra todo mundo no Explorar).
app.all('/api/content-sources', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireAdmin(req, db)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  try {
    if (req.method === 'GET') {
      const rows = await db.select().from(contentSources)
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as ContentSourceInput
      if (!body.topicPageId) return jsonResponse({ error: 'topicPageId é obrigatório' }, { status: 400 })
      if (!body.name?.trim()) return jsonResponse({ error: 'name é obrigatório' }, { status: 400 })
      if (!body.feedUrl?.trim()) return jsonResponse({ error: 'feedUrl é obrigatório' }, { status: 400 })
      try {
        const parsed = new URL(body.feedUrl)
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('protocolo inválido')
      } catch {
        return jsonResponse({ error: 'feedUrl inválida' }, { status: 400 })
      }
      const nameError = validateText(body.name, 100)
      if (nameError) return jsonResponse({ error: nameError }, { status: 400 })

      const [row] = await db
        .insert(contentSources)
        .values({ topicPageId: body.topicPageId, name: body.name.trim(), feedUrl: body.feedUrl.trim() })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    if (req.method === 'PUT') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const body = (await req.json()) as Partial<{ active: boolean; name: string }>
      const [row] = await db
        .update(contentSources)
        .set({ ...(body.active !== undefined ? { active: body.active } : {}), ...(body.name ? { name: body.name } : {}) })
        .where(eq(contentSources.id, Number(id)))
        .returning()
      if (!row) return jsonResponse({ error: 'fonte não encontrada' }, { status: 404 })
      return jsonResponse(row)
    }

    if (req.method === 'DELETE') {
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      await db.delete(contentSources).where(and(eq(contentSources.id, Number(id))))
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('content-sources route error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
