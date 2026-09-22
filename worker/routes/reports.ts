import { Hono } from 'hono'
import { and, desc, eq, inArray, ne } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { reports, users, profile, posts, communityPosts, postComments, communityPostComments } from '../../shared/schema'
import { jsonResponse, requireUser, requireAdmin } from '../shared/auth'
import { isRateLimited } from '../shared/rateLimit'
import { validateText } from '../shared/contentLimits'
import type { ReportInput, ReportWithDetails } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()
const VALID_TARGET_TYPES = new Set<string>(['user', 'post', 'community_post', 'comment', 'community_comment'])
const REPORT_WINDOW_MS = 60 * 60 * 1000
const REPORT_MAX_PER_USER = 10

async function resolveTargetPreview(db: ReturnType<typeof getDb>, targetType: string, targetId: number): Promise<string> {
  try {
    if (targetType === 'user') {
      const [p] = await db
        .select({ username: profile.username, displayName: profile.displayName })
        .from(profile)
        .where(eq(profile.userId, targetId))
        .limit(1)
      return p ? `@${p.username || '?'} — ${p.displayName || ''}` : 'conta não encontrada'
    }
    if (targetType === 'post') {
      const [row] = await db.select({ text: posts.text }).from(posts).where(eq(posts.id, targetId)).limit(1)
      return row ? row.text?.slice(0, 140) || '(post sem texto)' : '(post já removido)'
    }
    if (targetType === 'community_post') {
      const [row] = await db.select({ text: communityPosts.text }).from(communityPosts).where(eq(communityPosts.id, targetId)).limit(1)
      return row ? row.text?.slice(0, 140) || '(post sem texto)' : '(post já removido)'
    }
    if (targetType === 'comment') {
      const [row] = await db.select({ text: postComments.text }).from(postComments).where(eq(postComments.id, targetId)).limit(1)
      return row ? row.text.slice(0, 140) : '(comentário já removido)'
    }
    if (targetType === 'community_comment') {
      const [row] = await db
        .select({ text: communityPostComments.text })
        .from(communityPostComments)
        .where(eq(communityPostComments.id, targetId))
        .limit(1)
      return row ? row.text.slice(0, 140) : '(comentário já removido)'
    }
  } catch {
    // segue com preview vazio se algo der errado resolvendo
  }
  return ''
}

app.all('/api/reports', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)

  try {
    if (req.method === 'POST') {
      const auth = await requireUser(req, db)
      if (auth instanceof Response) return auth
      const { user } = auth

      const body = (await req.json()) as ReportInput
      if (!VALID_TARGET_TYPES.has(body.targetType)) return jsonResponse({ error: 'tipo de denúncia inválido' }, { status: 400 })
      if (!body.targetId || !Number.isInteger(body.targetId)) return jsonResponse({ error: 'targetId é obrigatório' }, { status: 400 })
      if (body.targetType === 'user' && body.targetId === user.id) {
        return jsonResponse({ error: 'não dá pra denunciar sua própria conta' }, { status: 400 })
      }
      const reasonError = validateText(body.reason, 500)
      if (reasonError) return jsonResponse({ error: reasonError }, { status: 400 })

      // já tem uma denúncia sua pra esse mesmo alvo ainda pendente — não deixa duplicar (evita
      // encher a fila do admin com N cópias da mesma denúncia).
      const [pendingDuplicate] = await db
        .select({ id: reports.id })
        .from(reports)
        .where(
          and(
            eq(reports.reporterId, user.id),
            eq(reports.targetType, body.targetType),
            eq(reports.targetId, body.targetId),
            eq(reports.status, 'pending'),
          ),
        )
        .limit(1)
      if (pendingDuplicate) return jsonResponse({ error: 'você já denunciou isso — a denúncia ainda está pendente de revisão' }, { status: 409 })

      if (await isRateLimited(db, `report:${user.id}`, REPORT_WINDOW_MS, REPORT_MAX_PER_USER)) {
        return jsonResponse({ error: 'Muitas denúncias em pouco tempo. Espere um pouco.' }, { status: 429 })
      }

      const [row] = await db
        .insert(reports)
        .values({
          reporterId: user.id,
          targetType: body.targetType,
          targetId: body.targetId,
          reason: body.reason?.trim() || null,
        })
        .returning()
      return jsonResponse(row, { status: 201 })
    }

    // GET (listar) e PUT (revisar) são só pra admin
    const auth = await requireAdmin(req, db)
    if (auth instanceof Response) return auth
    const { user } = auth

    if (req.method === 'GET') {
      // pendente nunca pode ser espremida pra fora da lista por causa de denúncias antigas já
      // revisadas — por isso são duas consultas separadas, não um único top-200 de qualquer status.
      const [pendingRows, otherRows] = await Promise.all([
        db.select().from(reports).where(eq(reports.status, 'pending')).orderBy(desc(reports.createdAt)).limit(500),
        db.select().from(reports).where(ne(reports.status, 'pending')).orderBy(desc(reports.createdAt)).limit(200),
      ])
      const rows = [...pendingRows, ...otherRows]
      const reporterIds = [...new Set(rows.map((r) => r.reporterId))]
      const reporterRows = reporterIds.length
        ? await db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.id, reporterIds))
        : []
      const emailById = new Map(reporterRows.map((r) => [r.id, r.email]))

      const out: ReportWithDetails[] = []
      for (const r of rows) {
        const targetPreview = await resolveTargetPreview(db, r.targetType, r.targetId)
        out.push({ ...r, reporterEmail: emailById.get(r.reporterId) ?? '', targetPreview })
      }
      return jsonResponse(out)
    }

    if (req.method === 'PUT') {
      const id = Number(new URL(req.url).searchParams.get('id'))
      if (!id) return jsonResponse({ error: 'id é obrigatório' }, { status: 400 })
      const { status } = (await req.json()) as { status?: string }
      if (status !== 'reviewed' && status !== 'dismissed' && status !== 'pending') {
        return jsonResponse({ error: 'status inválido' }, { status: 400 })
      }
      const [row] = await db
        .update(reports)
        .set({ status, reviewedBy: user.id, reviewedAt: new Date() })
        .where(eq(reports.id, id))
        .returning()
      if (!row) return jsonResponse({ error: 'denúncia não encontrada' }, { status: 404 })
      return jsonResponse(row)
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('reports function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
