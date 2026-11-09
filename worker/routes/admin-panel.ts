import { Hono } from 'hono'
import { and, count, countDistinct, desc, eq, gte, ilike, inArray, or, sql } from 'drizzle-orm'
import { getDb } from '../shared/db'
import {
  adminNotes,
  communityPosts,
  doseLogs,
  messages,
  moodEntries,
  posts,
  profile,
  quarantinedImages,
  reports,
  sessions,
  users,
} from '../../shared/schema'
import { jsonResponse, requireAdmin } from '../shared/auth'
import { logModerationAction } from '../shared/moderation'
import type { Env } from '../env'

// Painel de administração (/admin no app). Tudo aqui exige admin. As ações que já existiam
// (verificar, tornar admin, excluir conta, apagar post, denúncias) continuam nas rotas antigas —
// aqui fica o que o painel novo precisa a mais: números, busca de contas, detalhe, notas, banir com
// motivo, quarentena de imagens e conteúdo recente.

const app = new Hono<{ Bindings: Env }>()
const DAY_MS = 86_400_000
const USERS_PAGE = 50

async function admin(c: { req: { raw: Request }; env: Env }) {
  const db = getDb(c.env)
  const auth = await requireAdmin(c.req.raw, db)
  return { db, auth }
}

app.get('/api/admin/stats', async (c) => {
  const { db, auth } = await admin(c)
  if (auth instanceof Response) return auth
  try {
    const now = Date.now()
    const d1 = new Date(now - DAY_MS)
    const d7 = new Date(now - 7 * DAY_MS)
    const d30 = new Date(now - 30 * DAY_MS)

    const [
      [totals],
      [new1],
      [new7],
      [new30],
      [banned],
      [posts1],
      [posts7],
      [pendingReports],
      [pendingQuarantine],
      [activeMood],
      [activeDose],
      [activeSessions],
      signups,
    ] = await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(users).where(gte(users.createdAt, d1)),
      db.select({ value: count() }).from(users).where(gte(users.createdAt, d7)),
      db.select({ value: count() }).from(users).where(gte(users.createdAt, d30)),
      db.select({ value: count() }).from(users).where(eq(users.banned, true)),
      db.select({ value: count() }).from(posts).where(gte(posts.createdAt, d1)),
      db.select({ value: count() }).from(posts).where(gte(posts.createdAt, d7)),
      db.select({ value: count() }).from(reports).where(eq(reports.status, 'pending')),
      db.select({ value: count() }).from(quarantinedImages).where(eq(quarantinedImages.status, 'pending')),
      db.select({ value: countDistinct(moodEntries.userId) }).from(moodEntries).where(gte(moodEntries.createdAt, d1)),
      db.select({ value: countDistinct(doseLogs.userId) }).from(doseLogs).where(and(gte(doseLogs.createdAt, d1), eq(doseLogs.backfilled, false))),
      db.select({ value: countDistinct(sessions.userId) }).from(sessions).where(gte(sessions.createdAt, d7)),
      db
        .select({ day: sql<string>`to_char(date_trunc('day', ${users.createdAt} at time zone 'America/Sao_Paulo'), 'YYYY-MM-DD')`, value: count() })
        .from(users)
        .where(gte(users.createdAt, d30))
        .groupBy(sql`1`)
        .orderBy(sql`1`),
    ])

    return jsonResponse({
      totalUsers: totals.value,
      newUsers: { day: new1.value, week: new7.value, month: new30.value },
      bannedUsers: banned.value,
      posts: { day: posts1.value, week: posts7.value },
      pendingReports: pendingReports.value,
      pendingQuarantine: pendingQuarantine.value,
      // "ativas hoje" = registrou humor ou dose nas últimas 24h (o que dá pra medir sem rastrear acesso)
      activeToday: Math.max(activeMood.value, activeDose.value),
      loginsWeek: activeSessions.value,
      signupsByDay: signups,
    })
  } catch (err) {
    console.error('admin stats error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

app.get('/api/admin/users', async (c) => {
  const { db, auth } = await admin(c)
  if (auth instanceof Response) return auth
  try {
    const url = new URL(c.req.url)
    const q = url.searchParams.get('q')?.trim() ?? ''
    const filter = url.searchParams.get('filter') ?? 'all'
    const page = Math.max(0, Number(url.searchParams.get('page')) || 0)

    const conditions = []
    if (q) {
      const like = `%${q.replace(/[%_]/g, '')}%`
      conditions.push(or(ilike(users.email, like), ilike(profile.username, like), ilike(profile.displayName, like)))
    }
    if (filter === 'banned') conditions.push(eq(users.banned, true))
    if (filter === 'admins') conditions.push(eq(users.isAdmin, true))
    if (filter === 'unverifiedEmail') conditions.push(eq(users.emailVerified, false))
    if (filter === 'verified') conditions.push(eq(profile.isVerified, true))

    const where = conditions.length ? and(...conditions) : undefined
    const [rows, [total]] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          emailVerified: users.emailVerified,
          isAdmin: users.isAdmin,
          banned: users.banned,
          createdAt: users.createdAt,
          isVerified: profile.isVerified,
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          avatarIcon: profile.avatarIcon,
        })
        .from(users)
        .leftJoin(profile, eq(profile.userId, users.id))
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(USERS_PAGE)
        .offset(page * USERS_PAGE),
      db.select({ value: count() }).from(users).leftJoin(profile, eq(profile.userId, users.id)).where(where),
    ])

    return jsonResponse({
      items: rows.map((r) => ({ ...r, isVerified: r.isVerified ?? false })),
      total: total.value,
      page,
      pageSize: USERS_PAGE,
    })
  } catch (err) {
    console.error('admin users list error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

app.get('/api/admin/users/:id', async (c) => {
  const { db, auth } = await admin(c)
  if (auth instanceof Response) return auth
  try {
    const id = Number(c.req.param('id'))
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
    if (!user) return jsonResponse({ error: 'usuário não encontrado' }, { status: 404 })

    const [[prof], recentPosts, [postsCount], reportsAgainst, notes, quarantine, [lastSession]] = await Promise.all([
      db.select().from(profile).where(eq(profile.userId, id)).limit(1),
      db
        .select({ id: posts.id, text: posts.text, images: posts.images, createdAt: posts.createdAt })
        .from(posts)
        .where(eq(posts.userId, id))
        .orderBy(desc(posts.createdAt))
        .limit(10),
      db.select({ value: count() }).from(posts).where(eq(posts.userId, id)),
      db
        .select()
        .from(reports)
        .where(and(eq(reports.targetType, 'user'), eq(reports.targetId, id)))
        .orderBy(desc(reports.createdAt))
        .limit(20),
      db
        .select({ id: adminNotes.id, body: adminNotes.body, createdAt: adminNotes.createdAt, authorEmail: users.email })
        .from(adminNotes)
        .leftJoin(users, eq(users.id, adminNotes.authorId))
        .where(eq(adminNotes.userId, id))
        .orderBy(desc(adminNotes.createdAt)),
      db
        .select({ id: quarantinedImages.id, status: quarantinedImages.status, reason: quarantinedImages.reason, createdAt: quarantinedImages.createdAt })
        .from(quarantinedImages)
        .where(eq(quarantinedImages.userId, id))
        .orderBy(desc(quarantinedImages.createdAt)),
      db.select({ createdAt: sessions.createdAt }).from(sessions).where(eq(sessions.userId, id)).orderBy(desc(sessions.createdAt)).limit(1),
    ])

    return jsonResponse({
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        isAdmin: user.isAdmin,
        banned: user.banned,
        banReason: user.banReason,
        bannedAt: user.bannedAt,
        hasPassword: !!user.passwordHash,
        hasGoogle: !!user.googleId,
        createdAt: user.createdAt,
        lastLoginAt: lastSession?.createdAt ?? null,
      },
      profile: prof
        ? {
            username: prof.username,
            displayName: prof.displayName,
            pronouns: prof.pronouns,
            gender: prof.gender,
            bio: prof.bio,
            avatarUrl: prof.avatarUrl,
            avatarIcon: prof.avatarIcon,
            isVerified: prof.isVerified,
            isPrivate: prof.isPrivate,
            transitionStartDate: prof.transitionStartDate,
            country: prof.country,
            city: prof.city,
          }
        : null,
      postsCount: postsCount.value,
      recentPosts,
      reportsAgainst,
      notes,
      quarantine,
    })
  } catch (err) {
    console.error('admin user detail error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

app.post('/api/admin/users/:id/notes', async (c) => {
  const { db, auth } = await admin(c)
  if (auth instanceof Response) return auth
  try {
    const id = Number(c.req.param('id'))
    const { body } = (await c.req.json()) as { body?: string }
    const text = body?.trim() ?? ''
    if (!text || text.length > 2000) return jsonResponse({ error: 'nota vazia ou longa demais' }, { status: 400 })
    const [row] = await db.insert(adminNotes).values({ userId: id, authorId: auth.user.id, body: text }).returning()
    return jsonResponse(row, { status: 201 })
  } catch (err) {
    console.error('admin note error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

// banir com motivo (fica no painel e no registro) — desbanir limpa o motivo
app.post('/api/admin/users/:id/ban', async (c) => {
  const { db, auth } = await admin(c)
  if (auth instanceof Response) return auth
  try {
    const id = Number(c.req.param('id'))
    if (id === auth.user.id) return jsonResponse({ error: 'não é possível banir a própria conta' }, { status: 400 })
    const { banned, reason } = (await c.req.json()) as { banned?: boolean; reason?: string }
    if (typeof banned !== 'boolean') return jsonResponse({ error: 'banned é obrigatório' }, { status: 400 })
    const cleanReason = reason?.trim().slice(0, 500) || null

    const [row] = await db
      .update(users)
      .set(banned ? { banned: true, banReason: cleanReason, bannedAt: new Date() } : { banned: false, banReason: null, bannedAt: null })
      .where(eq(users.id, id))
      .returning({ id: users.id, email: users.email })
    if (!row) return jsonResponse({ error: 'usuário não encontrado' }, { status: 404 })
    // banida sai de todos os aparelhos na hora
    if (banned) await db.delete(sessions).where(eq(sessions.userId, id))
    await logModerationAction(db, auth.user.id, banned ? 'ban_user' : 'unban_user', id, { email: row.email, reason: cleanReason })
    return jsonResponse({ ok: true })
  } catch (err) {
    console.error('admin ban error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

app.get('/api/admin/quarantine', async (c) => {
  const { db, auth } = await admin(c)
  if (auth instanceof Response) return auth
  try {
    const status = new URL(c.req.url).searchParams.get('status') ?? 'pending'
    const rows = await db
      .select({
        id: quarantinedImages.id,
        userId: quarantinedImages.userId,
        reason: quarantinedImages.reason,
        scores: quarantinedImages.scores,
        status: quarantinedImages.status,
        createdAt: quarantinedImages.createdAt,
        reviewedAt: quarantinedImages.reviewedAt,
        email: users.email,
        username: profile.username,
        displayName: profile.displayName,
      })
      .from(quarantinedImages)
      .leftJoin(users, eq(users.id, quarantinedImages.userId))
      .leftJoin(profile, eq(profile.userId, quarantinedImages.userId))
      .where(status === 'all' ? undefined : eq(quarantinedImages.status, status))
      .orderBy(desc(quarantinedImages.createdAt))
      .limit(200)
    return jsonResponse(rows)
  } catch (err) {
    console.error('admin quarantine list error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

app.get('/api/admin/quarantine/:id/image', async (c) => {
  const { db, auth } = await admin(c)
  if (auth instanceof Response) return auth
  const [row] = await db.select().from(quarantinedImages).where(eq(quarantinedImages.id, Number(c.req.param('id')))).limit(1)
  if (!row || row.status === 'deleted') return new Response('not found', { status: 404 })
  const object = await c.env.IMAGES.get(row.r2Key)
  if (!object) return new Response('not found', { status: 404 })
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  // conteúdo sensível: nada de cache compartilhado
  headers.set('cache-control', 'private, no-store')
  return new Response(object.body, { headers })
})

// aprovar = falso positivo: a mesma imagem passa direto se a pessoa enviar de novo, e ela recebe um
// recado avisando. Apagar = remove o arquivo de vez (a linha fica, pra histórico).
app.post('/api/admin/quarantine/:id', async (c) => {
  const { db, auth } = await admin(c)
  if (auth instanceof Response) return auth
  try {
    const id = Number(c.req.param('id'))
    const { action } = (await c.req.json()) as { action?: 'approve' | 'delete' }
    const [row] = await db.select().from(quarantinedImages).where(eq(quarantinedImages.id, id)).limit(1)
    if (!row) return jsonResponse({ error: 'não encontrada' }, { status: 404 })

    if (action === 'approve') {
      await db.update(quarantinedImages).set({ status: 'approved', reviewedBy: auth.user.id, reviewedAt: new Date() }).where(eq(quarantinedImages.id, id))
      if (row.userId) {
        await db.insert(messages).values({
          userId: row.userId,
          icon: 'sparkles',
          title: 'Imagem liberada',
          body: 'A equipe revisou uma imagem que tinha sido barrada e liberou. Pode enviar de novo que ela vai passar.',
        })
      }
      await logModerationAction(db, auth.user.id, 'approve_image', row.userId, { reason: row.reason })
      return jsonResponse({ ok: true })
    }
    if (action === 'delete') {
      await c.env.IMAGES.delete(row.r2Key)
      await db.update(quarantinedImages).set({ status: 'deleted', reviewedBy: auth.user.id, reviewedAt: new Date() }).where(eq(quarantinedImages.id, id))
      await logModerationAction(db, auth.user.id, 'delete_quarantined_image', row.userId, { reason: row.reason })
      return jsonResponse({ ok: true })
    }
    return jsonResponse({ error: 'ação inválida' }, { status: 400 })
  } catch (err) {
    console.error('admin quarantine action error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

// conteúdo mais recente do app inteiro (feed + comunidades), pra moderação ativa
app.get('/api/admin/content', async (c) => {
  const { db, auth } = await admin(c)
  if (auth instanceof Response) return auth
  try {
    const [feedRows, communityRows] = await Promise.all([
      db
        .select({ id: posts.id, userId: posts.userId, text: posts.text, images: posts.images, createdAt: posts.createdAt })
        .from(posts)
        .where(sql`${posts.repostOfKind} is null`)
        .orderBy(desc(posts.createdAt))
        .limit(60),
      db
        .select({ id: communityPosts.id, userId: communityPosts.userId, text: communityPosts.text, images: communityPosts.images, createdAt: communityPosts.createdAt, communityId: communityPosts.communityId })
        .from(communityPosts)
        .orderBy(desc(communityPosts.createdAt))
        .limit(60),
    ])
    const ids = [...new Set([...feedRows, ...communityRows].map((r) => r.userId).filter((v): v is number => v != null))]
    const authors = ids.length
      ? await db.select({ userId: profile.userId, username: profile.username, displayName: profile.displayName }).from(profile).where(inArray(profile.userId, ids))
      : []
    const byId = new Map(authors.map((a) => [a.userId, a]))
    const items = [
      ...feedRows.map((r) => ({ ...r, kind: 'post' as const, communityId: null })),
      ...communityRows.map((r) => ({ ...r, kind: 'community' as const })),
    ]
      .map((r) => ({ ...r, author: r.userId != null ? (byId.get(r.userId) ?? null) : null }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 80)
    return jsonResponse(items)
  } catch (err) {
    console.error('admin content error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
