import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { users, profile } from '../../shared/schema'
import { jsonResponse, requireAdmin } from '../shared/auth'
import type { AdminUserSummary } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/admin-users', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireAdmin(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    if (req.method === 'GET') {
      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          emailVerified: users.emailVerified,
          isAdmin: users.isAdmin,
          banned: users.banned,
          createdAt: users.createdAt,
          isVerified: profile.isVerified,
        })
        .from(users)
        .leftJoin(profile, eq(profile.userId, users.id))
        .orderBy(users.createdAt)
      const out: AdminUserSummary[] = rows.map((r) => ({ ...r, isVerified: r.isVerified ?? false }))
      return jsonResponse(out)
    }

    if (req.method === 'PUT') {
      const id = Number(new URL(req.url).searchParams.get('id'))
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      if (id === user.id) return jsonResponse({ error: 'não é possível alterar a própria conta' }, { status: 400 })

      const { banned, isAdmin, isVerified } = (await req.json()) as {
        banned?: boolean
        isAdmin?: boolean
        isVerified?: boolean
      }
      if (typeof banned !== 'boolean' && typeof isAdmin !== 'boolean' && typeof isVerified !== 'boolean') {
        return jsonResponse({ error: 'banned, isAdmin ou isVerified é obrigatório' }, { status: 400 })
      }

      const userUpdates: Partial<{ banned: boolean; isAdmin: boolean }> = {}
      if (typeof banned === 'boolean') userUpdates.banned = banned
      if (typeof isAdmin === 'boolean') userUpdates.isAdmin = isAdmin

      let row: typeof users.$inferSelect | undefined
      if (Object.keys(userUpdates).length > 0) {
        ;[row] = await db.update(users).set(userUpdates).where(eq(users.id, id)).returning()
      } else {
        ;[row] = await db.select().from(users).where(eq(users.id, id)).limit(1)
      }
      if (!row) return jsonResponse({ error: 'usuário não encontrado' }, { status: 404 })

      if (typeof isVerified === 'boolean') {
        await db.update(profile).set({ isVerified }).where(eq(profile.userId, id))
      }
      const [profileRow] = await db.select({ isVerified: profile.isVerified }).from(profile).where(eq(profile.userId, id)).limit(1)

      const out: AdminUserSummary = {
        id: row.id,
        email: row.email,
        emailVerified: row.emailVerified,
        isAdmin: row.isAdmin,
        banned: row.banned,
        createdAt: row.createdAt,
        isVerified: profileRow?.isVerified ?? false,
      }
      return jsonResponse(out)
    }

    if (req.method === 'DELETE') {
      const id = Number(new URL(req.url).searchParams.get('id'))
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      if (id === user.id) return jsonResponse({ error: 'não é possível excluir a própria conta por aqui' }, { status: 400 })

      // cascade cuida de apagar profile, posts, mensagens, follows, likes, comentários, sessões etc.
      // (imagens no R2 dessa conta não são limpas aqui — mesma limitação da auto-exclusão de conta)
      const [deleted] = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id })
      if (!deleted) return jsonResponse({ error: 'usuário não encontrado' }, { status: 404 })
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('admin-users function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
