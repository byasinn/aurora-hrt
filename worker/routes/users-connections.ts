import { Hono } from 'hono'
import { and, eq, ilike, inArray, or } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { follows, profile } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { isFollowing } from '../shared/social'
import { hasBlockRelation } from '../shared/blocks'
import type { PublicUserSummary } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/users-connections', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  const url = new URL(req.url)
  const targetId = Number(url.searchParams.get('userId'))
  const type = url.searchParams.get('type')
  const q = (url.searchParams.get('q')?.trim() ?? '').replace(/^@/, '')
  if (!targetId) return jsonResponse({ error: 'userId é obrigatório' }, { status: 400 })
  if (type !== 'followers' && type !== 'following') {
    return jsonResponse({ error: 'type deve ser followers ou following' }, { status: 400 })
  }

  try {
    if (targetId !== user.id) {
      // bloqueio em qualquer direção esconde a lista de seguidores/seguindo, igual já vale pra
      // perfil/DM/seguir — sem isso, bloquear alguém não impedia ele de listar seu círculo social
      // se o perfil fosse público.
      if (await hasBlockRelation(db, user.id, targetId)) {
        return jsonResponse({ error: 'esse perfil é privado' }, { status: 403 })
      }
      const [targetProfile] = await db.select({ isPrivate: profile.isPrivate }).from(profile).where(eq(profile.userId, targetId)).limit(1)
      if (targetProfile?.isPrivate && !(await isFollowing(db, user.id, targetId))) {
        return jsonResponse({ error: 'esse perfil é privado' }, { status: 403 })
      }
    }

    const rows =
      type === 'followers'
        ? await db
            .select({ userId: follows.followerId })
            .from(follows)
            .where(and(eq(follows.followingId, targetId), eq(follows.status, 'accepted')))
        : await db
            .select({ userId: follows.followingId })
            .from(follows)
            .where(and(eq(follows.followerId, targetId), eq(follows.status, 'accepted')))

    const userIds = rows.map((r) => r.userId)
    if (userIds.length === 0) return jsonResponse([])

    const conditions = [inArray(profile.userId, userIds)]
    if (q) conditions.push(or(ilike(profile.displayName, `%${q}%`), ilike(profile.username, `%${q}%`))!)
    const profiles = await db
      .select()
      .from(profile)
      .where(and(...conditions))

    const myFollowing = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(and(eq(follows.followerId, user.id), eq(follows.status, 'accepted')))
    const myFollowingSet = new Set(myFollowing.map((f) => f.followingId))

    const out: PublicUserSummary[] = profiles
      .map((p) => ({
        userId: p.userId!,
        username: p.username ?? '',
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        avatarIcon: p.avatarIcon,
        pronouns: p.pronouns,
        isFollowedByMe: myFollowingSet.has(p.userId!),
        isVerified: p.isVerified,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName))

    return jsonResponse(out)
  } catch (err) {
    console.error('users-connections function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
