import type { Context } from '@netlify/functions'
import { desc, eq, inArray, or } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { directMessages, profile } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import type { DmThread } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const rows = await db
      .select()
      .from(directMessages)
      .where(or(eq(directMessages.senderId, user.id), eq(directMessages.recipientId, user.id)))
      .orderBy(desc(directMessages.createdAt))

    const byOther = new Map<number, typeof rows>()
    for (const m of rows) {
      const otherId = m.senderId === user.id ? m.recipientId : m.senderId
      const list = byOther.get(otherId) ?? []
      list.push(m)
      byOther.set(otherId, list)
    }

    const otherIds = [...byOther.keys()]
    const profiles = otherIds.length ? await db.select().from(profile).where(inArray(profile.userId, otherIds)) : []
    const profileById = new Map(profiles.map((p) => [p.userId, p]))

    const threads: DmThread[] = otherIds
      .map((otherId) => {
        const list = byOther.get(otherId)!
        const last = list[0]
        const unreadCount = list.filter((m) => m.recipientId === user.id && !m.readAt).length
        const p = profileById.get(otherId)
        return {
          userId: otherId,
          displayName: p?.displayName ?? '',
          avatarUrl: p?.avatarUrl ?? null,
          avatarIcon: p?.avatarIcon ?? null,
          lastMessage: last.body,
          lastMessageAt: last.createdAt.toISOString(),
          unreadCount,
        }
      })
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))

    return jsonResponse(threads)
  } catch (err) {
    console.error('dm-threads function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
