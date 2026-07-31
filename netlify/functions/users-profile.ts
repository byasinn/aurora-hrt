import type { Context } from '@netlify/functions'
import { and, count, eq } from 'drizzle-orm'
import { getDb } from './_shared/db'
import { profile, follows, moodEntries, medications } from '../../shared/schema'
import { jsonResponse, requireUser } from './_shared/auth'
import { enrichPosts, isFollowing, postsByUser } from './_shared/social'
import type { SharedMedicationSummary, UserProfileDetail } from '../../shared/types'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  const targetId = Number(new URL(req.url).searchParams.get('userId'))
  if (!targetId) return jsonResponse({ error: 'userId é obrigatório' }, { status: 400 })

  try {
    const [targetProfile] = await db.select().from(profile).where(eq(profile.userId, targetId)).limit(1)
    if (!targetProfile) return jsonResponse({ error: 'not found' }, { status: 404 })

    const isSelf = user.id === targetId
    const following = isSelf ? false : await isFollowing(db, user.id, targetId)

    const [[{ value: followerCount }], [{ value: followingCount }]] = await Promise.all([
      db.select({ value: count() }).from(follows).where(eq(follows.followingId, targetId)),
      db.select({ value: count() }).from(follows).where(eq(follows.followerId, targetId)),
    ])

    let avgMood: number | null = null
    let avgLibido: number | null = null
    if (targetProfile.shareAvgMood || targetProfile.shareLibido) {
      const moods = await db.select().from(moodEntries).where(eq(moodEntries.userId, targetId))
      if (targetProfile.shareAvgMood) {
        const energies = moods.map((m) => m.energyLevel).filter((v): v is number => v != null)
        avgMood = energies.length ? energies.reduce((a, b) => a + b, 0) / energies.length : null
      }
      if (targetProfile.shareLibido) {
        const libidos = moods.map((m) => m.libidoLevel).filter((v): v is number => v != null)
        avgLibido = libidos.length ? libidos.reduce((a, b) => a + b, 0) / libidos.length : null
      }
    }

    let medicationsOut: SharedMedicationSummary[] | null = null
    if (targetProfile.shareMedications) {
      const meds = await db
        .select()
        .from(medications)
        .where(and(eq(medications.userId, targetId), eq(medications.active, true)))
      medicationsOut = meds.map((m) => ({
        name: m.name,
        doseAmount: m.doseAmount,
        doseUnit: m.doseUnit,
        route: m.route,
      }))
    }

    let hrtDurationDays: number | null = null
    if (targetProfile.shareHrtDuration && targetProfile.transitionStartDate) {
      hrtDurationDays = Math.floor(
        (Date.now() - new Date(targetProfile.transitionStartDate).getTime()) / 86_400_000,
      )
    }

    const postsOut = isSelf || following ? await enrichPosts(db, await postsByUser(db, targetId), user.id) : []

    const result: UserProfileDetail = {
      userId: targetId,
      displayName: targetProfile.displayName,
      avatarUrl: targetProfile.avatarUrl,
      avatarIcon: targetProfile.avatarIcon,
      pronouns: targetProfile.pronouns,
      isFollowedByMe: following,
      bio: targetProfile.bio,
      coverUrl: targetProfile.coverUrl,
      followerCount,
      followingCount,
      avgMood,
      avgLibido,
      medications: medicationsOut,
      hrtDurationDays,
      posts: postsOut,
    }
    return jsonResponse(result)
  } catch (err) {
    console.error('users-profile function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
