import { Hono } from 'hono'
import { and, count, eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import {
  profile,
  follows,
  moodEntries,
  medications,
  unlockedAchievements,
  unlockedTrophies,
  unlockedTitles,
} from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { enrichPosts, postsByUser } from '../shared/social'
import { hasBlockRelation } from '../shared/blocks'
import type { SharedMedicationSummary, UserProfileDetail, ExternalLink } from '../../shared/types'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/users-profile', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  const url = new URL(req.url)
  const userIdParam = url.searchParams.get('userId')
  const usernameParam = url.searchParams.get('username')?.trim().toLowerCase()
  if (!userIdParam && !usernameParam) {
    return jsonResponse({ error: 'userId ou username é obrigatório' }, { status: 400 })
  }

  try {
    const [targetProfile] = userIdParam
      ? await db.select().from(profile).where(eq(profile.userId, Number(userIdParam))).limit(1)
      : await db.select().from(profile).where(eq(profile.username, usernameParam!)).limit(1)
    if (!targetProfile || targetProfile.userId == null) return jsonResponse({ error: 'not found' }, { status: 404 })

    const targetId = targetProfile.userId
    const isSelf = user.id === targetId

    if (!isSelf && (await hasBlockRelation(db, user.id, targetId))) {
      return jsonResponse({ error: 'not found' }, { status: 404 })
    }

    const [
      myFollowRow,
      [{ value: followerCount }],
      [{ value: followingCount }],
      moods,
      meds,
      rawPosts,
      achievementRows,
      trophyRows,
      specialTitleRows,
    ] = await Promise.all([
      isSelf
        ? Promise.resolve(null)
        : db
            .select({ status: follows.status })
            .from(follows)
            .where(and(eq(follows.followerId, user.id), eq(follows.followingId, targetId)))
            .limit(1)
            .then((rows) => rows[0] ?? null),
      db.select({ value: count() }).from(follows).where(and(eq(follows.followingId, targetId), eq(follows.status, 'accepted'))),
      db.select({ value: count() }).from(follows).where(and(eq(follows.followerId, targetId), eq(follows.status, 'accepted'))),
      targetProfile.shareAvgMood || targetProfile.shareLibido
        ? db.select().from(moodEntries).where(eq(moodEntries.userId, targetId))
        : Promise.resolve([]),
      targetProfile.shareMedications
        ? db.select().from(medications).where(and(eq(medications.userId, targetId), eq(medications.active, true)))
        : Promise.resolve([]),
      postsByUser(db, targetId),
      targetProfile.showAchievementsOnProfile
        ? db.select().from(unlockedAchievements).where(eq(unlockedAchievements.userId, targetId))
        : Promise.resolve([]),
      targetProfile.showTrophiesOnProfile
        ? db.select().from(unlockedTrophies).where(eq(unlockedTrophies.userId, targetId))
        : Promise.resolve([]),
      db.select().from(unlockedTitles).where(and(eq(unlockedTitles.userId, targetId), eq(unlockedTitles.track, 'special'))),
    ])

    const following = myFollowRow?.status === 'accepted'
    const followRequestPending = myFollowRow?.status === 'pending'
    const canViewTheirPosts = isSelf || following
    // conta privada: estatísticas opcionais só aparecem pra quem já é seguidor aceito
    const canViewStats = !targetProfile.isPrivate || canViewTheirPosts

    let avgMood: number | null = null
    let avgLibido: number | null = null
    if (targetProfile.shareAvgMood && canViewStats) {
      const energies = moods.map((m) => m.energyLevel).filter((v): v is number => v != null)
      avgMood = energies.length ? energies.reduce((a, b) => a + b, 0) / energies.length : null
    }
    if (targetProfile.shareLibido && canViewStats) {
      const libidos = moods.map((m) => m.libidoLevel).filter((v): v is number => v != null)
      avgLibido = libidos.length ? libidos.reduce((a, b) => a + b, 0) / libidos.length : null
    }

    const medicationsOut: SharedMedicationSummary[] | null =
      targetProfile.shareMedications && canViewStats
        ? meds.map((m) => ({ name: m.name, doseAmount: m.doseAmount, doseUnit: m.doseUnit, route: m.route }))
        : null

    let hrtDurationDays: number | null = null
    if (targetProfile.shareHrtDuration && canViewStats && targetProfile.transitionStartDate) {
      hrtDurationDays = Math.floor(
        (Date.now() - new Date(targetProfile.transitionStartDate).getTime()) / 86_400_000,
      )
    }

    const postsOut = canViewTheirPosts ? await enrichPosts(db, rawPosts, user.id) : []

    const achievementsOut: string[] | null = targetProfile.showAchievementsOnProfile && canViewStats
      ? achievementRows.map((r) => r.achievementKey)
      : null
    const trophiesOut: string[] | null = targetProfile.showTrophiesOnProfile && canViewStats
      ? trophyRows.map((r) => r.trophyKey)
      : null

    const specialKeys = new Set(specialTitleRows.map((r) => r.titleKey))
    // Prioridade: criadora > beta_tester (uma conta promovida a admin depois de já ter beta tester deve mostrar criadora).
    const specialTitleKey = specialKeys.has('criadora') ? 'criadora' : specialKeys.has('beta_tester') ? 'beta_tester' : null

    const result: UserProfileDetail = {
      userId: targetId,
      username: targetProfile.username ?? '',
      displayName: targetProfile.displayName,
      avatarUrl: targetProfile.avatarUrl,
      avatarIcon: targetProfile.avatarIcon,
      pronouns: targetProfile.pronouns,
      isFollowedByMe: following,
      isVerified: targetProfile.isVerified,
      bio: targetProfile.bio,
      coverUrl: targetProfile.coverUrl,
      textStyle: targetProfile.textStyle,
      isPrivate: targetProfile.isPrivate,
      followRequestPending,
      followerCount,
      followingCount,
      avgMood,
      avgLibido,
      medications: medicationsOut,
      hrtDurationDays,
      posts: postsOut,
      titleSfw: targetProfile.showTitlesSfw ? targetProfile.equippedTitleSfw : null,
      titleSpecial: specialTitleKey,
      achievements: achievementsOut,
      trophies: trophiesOut,
      postsCollageStyle: targetProfile.postsCollageStyle,
      externalLinks: (targetProfile.externalLinks as ExternalLink[] | null) ?? [],
    }
    return jsonResponse(result)
  } catch (err) {
    console.error('users-profile function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
