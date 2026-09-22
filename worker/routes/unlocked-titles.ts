import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { unlockedTitles } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { computeServerPointsStats } from '../shared/pointsStats'
import { SFW_TITLES } from '../../src/lib/titles'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/unlocked-titles', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    if (req.method === 'GET') {
      const rows = await db.select().from(unlockedTitles).where(eq(unlockedTitles.userId, user.id))
      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const { key, track } = (await req.json()) as { key?: string; track?: string }
      if (!key || (track !== 'sfw' && track !== 'special')) {
        return jsonResponse({ error: 'key e track são obrigatórios' }, { status: 400 })
      }

      const [existing] = await db
        .select()
        .from(unlockedTitles)
        .where(and(eq(unlockedTitles.titleKey, key), eq(unlockedTitles.userId, user.id)))
      if (existing) return jsonResponse(existing)

      // o cliente só manda o pedido — quem decide se ganhou é o servidor, recalculando os pontos
      // do zero. Sem isso, uma chamada de API direta liberava qualquer título (inclusive o máximo)
      // sem ter um único ponto de verdade.
      if (track === 'sfw') {
        const title = SFW_TITLES.find((t) => t.key === key)
        if (!title) return jsonResponse({ error: 'título desconhecido' }, { status: 400 })
        const stats = await computeServerPointsStats(db, user.id)
        if (stats.brilho < title.threshold) {
          return jsonResponse({ error: 'pontuação insuficiente pra esse título' }, { status: 403 })
        }
      } else {
        // track 'special': 'criadora' só pra quem já é admin; 'beta_tester' não é mais concedido
        // a ninguém por aqui (só quem já tinha de antes continua com o título).
        if (key !== 'criadora' || !user.isAdmin) {
          return jsonResponse({ error: 'título não disponível' }, { status: 403 })
        }
      }

      const [row] = await db
        .insert(unlockedTitles)
        .values({ titleKey: key, track, userId: user.id })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('unlocked-titles function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
