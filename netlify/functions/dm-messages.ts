import type { Context } from '@netlify/functions'
import { and, eq, isNull, or } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { directMessages, users } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import type { DirectMessageInput } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    if (req.method === 'GET') {
      const otherId = Number(new URL(req.url).searchParams.get('userId'))
      if (!otherId) return jsonResponse({ error: 'userId é obrigatório' }, { status: 400 })

      const rows = await db
        .select()
        .from(directMessages)
        .where(
          or(
            and(eq(directMessages.senderId, user.id), eq(directMessages.recipientId, otherId)),
            and(eq(directMessages.senderId, otherId), eq(directMessages.recipientId, user.id)),
          ),
        )
        .orderBy(directMessages.createdAt)

      await db
        .update(directMessages)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(directMessages.senderId, otherId),
            eq(directMessages.recipientId, user.id),
            isNull(directMessages.readAt),
          ),
        )

      return jsonResponse(rows)
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as DirectMessageInput
      if (!body.recipientId || !body.body?.trim()) {
        return jsonResponse({ error: 'recipientId e body são obrigatórios' }, { status: 400 })
      }
      if (body.recipientId === user.id) {
        return jsonResponse({ error: 'não é possível enviar mensagem pra si mesmo' }, { status: 400 })
      }
      const [target] = await db.select().from(users).where(eq(users.id, body.recipientId)).limit(1)
      if (!target) return jsonResponse({ error: 'usuário não encontrado' }, { status: 404 })

      const [row] = await db
        .insert(directMessages)
        .values({ senderId: user.id, recipientId: body.recipientId, body: body.body.trim() })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('dm-messages function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
