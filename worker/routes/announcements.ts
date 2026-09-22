import { Hono } from 'hono'
import { desc } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { appAnnouncements } from '../../shared/schema'
import { jsonResponse, requireUser, requireAdmin } from '../shared/auth'
import { validateText } from '../shared/contentLimits'
import type { AppAnnouncementInput } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

// GET é pra qualquer usuário logado (o app inteiro checa isso ao abrir); POST é só admin, pra criar
// um aviso novo sem precisar de deploy — o painel de admin (AdminAnnouncementsScreen) usa isso.
app.all('/api/announcements', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)

  try {
    if (req.method === 'GET') {
      const auth = await requireUser(req, db)
      if (auth instanceof Response) return auth

      const [latest] = await db.select().from(appAnnouncements).orderBy(desc(appAnnouncements.createdAt)).limit(1)
      return jsonResponse(latest ?? null)
    }

    if (req.method === 'POST') {
      const auth = await requireAdmin(req, db)
      if (auth instanceof Response) return auth

      const body = (await req.json()) as AppAnnouncementInput
      if (!body.version?.trim()) return jsonResponse({ error: 'version é obrigatório' }, { status: 400 })
      if (!body.title?.trim()) return jsonResponse({ error: 'title é obrigatório' }, { status: 400 })
      if (!body.body?.trim()) return jsonResponse({ error: 'body é obrigatório' }, { status: 400 })
      const versionError = validateText(body.version, 30)
      if (versionError) return jsonResponse({ error: versionError }, { status: 400 })
      const titleError = validateText(body.title, 120)
      if (titleError) return jsonResponse({ error: titleError }, { status: 400 })
      const bodyError = validateText(body.body, 4000)
      if (bodyError) return jsonResponse({ error: bodyError }, { status: 400 })

      const [row] = await db
        .insert(appAnnouncements)
        .values({ version: body.version.trim(), title: body.title.trim(), body: body.body.trim() })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('announcements route error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
