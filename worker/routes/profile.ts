import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { profile } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { validateSingleImage, validateText, validateExternalLinks, validateIntRange } from '../shared/contentLimits'
import { validateUsernameFormat, generateUniqueUsername } from '../shared/username'
import { deleteR2Images } from '../shared/images'
import type { ProfileInput } from '../../shared/types'
import type { Env } from '../env'

const DISPLAY_NAME_MAX_CHANGES = 3
const DISPLAY_NAME_WINDOW_MS = 30 * 24 * 60 * 60 * 1000
const USERNAME_MAX_CHANGES = 3
const USERNAME_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

async function getOrCreateProfile(db: ReturnType<typeof getDb>, userId: number) {
  const [existing] = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1)
  if (existing) return existing
  const username = await generateUniqueUsername(db)
  const [created] = await db.insert(profile).values({ userId, username }).returning()
  return created
}

const app = new Hono<{ Bindings: Env }>()

app.all('/api/profile', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    if (req.method === 'GET') {
      const row = await getOrCreateProfile(db, user.id)
      return jsonResponse(row)
    }

    if (req.method === 'PUT') {
      const current = await getOrCreateProfile(db, user.id)
      const body = (await req.json()) as ProfileInput

      const avatarError = validateSingleImage(body.avatarUrl)
      if (avatarError) return jsonResponse({ error: avatarError }, { status: 413 })
      const coverError = validateSingleImage(body.coverUrl)
      if (coverError) return jsonResponse({ error: coverError }, { status: 413 })
      const bioError = validateText(body.bio, 500)
      if (bioError) return jsonResponse({ error: bioError }, { status: 400 })
      const linksError = validateExternalLinks(body.externalLinks)
      if (linksError) return jsonResponse({ error: linksError }, { status: 400 })
      const cycleLengthError = validateIntRange(body.averageCycleLength, 15, 60, 'averageCycleLength')
      if (cycleLengthError) return jsonResponse({ error: cycleLengthError }, { status: 400 })
      const periodLengthError = validateIntRange(body.averagePeriodLength, 1, 15, 'averagePeriodLength')
      if (periodLengthError) return jsonResponse({ error: periodLengthError }, { status: 400 })

      const changingName = typeof body.displayName === 'string' && body.displayName.trim() !== current.displayName
      const updates: ProfileInput & {
        displayNameChangeCount?: number
        displayNameChangeWindowStart?: Date | null
        usernameChangeCount?: number
        usernameChangeWindowStart?: Date | null
      } = { ...body }

      if (changingName) {
        const windowStart = current.displayNameChangeWindowStart
        const windowExpired = !windowStart || Date.now() - new Date(windowStart).getTime() > DISPLAY_NAME_WINDOW_MS
        const countInWindow = windowExpired ? 0 : current.displayNameChangeCount

        if (countInWindow >= DISPLAY_NAME_MAX_CHANGES) {
          return jsonResponse(
            { error: 'Você já trocou o nome de exibição 3 vezes este mês. Tente de novo mais tarde.' },
            { status: 429 },
          )
        }

        updates.displayNameChangeCount = countInWindow + 1
        updates.displayNameChangeWindowStart = windowExpired ? new Date() : windowStart
      }

      if (typeof body.username === 'string') {
        const normalized = body.username.trim().toLowerCase()
        const changingUsername = normalized !== current.username

        if (changingUsername) {
          const formatError = validateUsernameFormat(normalized)
          if (formatError) return jsonResponse({ error: formatError }, { status: 400 })

          const [taken] = await db.select({ id: profile.id }).from(profile).where(eq(profile.username, normalized)).limit(1)
          if (taken) return jsonResponse({ error: 'Esse nome de usuário já está em uso.' }, { status: 409 })

          const windowStart = current.usernameChangeWindowStart
          const windowExpired = !windowStart || Date.now() - new Date(windowStart).getTime() > USERNAME_WINDOW_MS
          const countInWindow = windowExpired ? 0 : current.usernameChangeCount

          if (countInWindow >= USERNAME_MAX_CHANGES) {
            return jsonResponse(
              { error: 'Você já trocou de nome de usuário 3 vezes este mês. Tente de novo mais tarde.' },
              { status: 429 },
            )
          }

          updates.username = normalized
          updates.usernameChangeCount = countInWindow + 1
          updates.usernameChangeWindowStart = windowExpired ? new Date() : windowStart
        } else {
          delete updates.username
        }
      }

      try {
        const [row] = await db
          .update(profile)
          .set(updates)
          .where(and(eq(profile.id, current.id), eq(profile.userId, user.id)))
          .returning()

        // 'avatarUrl' in body cobre tanto trocar por uma nova imagem quanto limpar (null) — nos dois
        // casos a imagem antiga no R2 fica órfã se não for apagada aqui.
        const oldImages: (string | null)[] = []
        if ('avatarUrl' in body && body.avatarUrl !== current.avatarUrl) oldImages.push(current.avatarUrl)
        if ('coverUrl' in body && body.coverUrl !== current.coverUrl) oldImages.push(current.coverUrl)
        if (oldImages.length > 0) await deleteR2Images(c.env, oldImages)

        return jsonResponse(row)
      } catch (err) {
        if (err instanceof Error && 'code' in err && (err as { code: string }).code === '23505') {
          return jsonResponse({ error: 'Esse nome de usuário já está em uso.' }, { status: 409 })
        }
        throw err
      }
    }

    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  } catch (err) {
    console.error('profile route error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
