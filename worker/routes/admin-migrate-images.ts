import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { profile, posts, communityPosts } from '../../shared/schema'
import { jsonResponse, requireAdmin, secretEquals } from '../shared/auth'
import { migrateDataUrlToR2 } from '../shared/images'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

/**
 * Migração única de imagens base64 (salvas direto no Postgres antes do R2 existir) pro R2.
 * Igual admin-wipe-images.ts: exige sessão de admin E o BOOTSTRAP_SECRET — só o secret sozinho
 * bastava antes, e como essa rota mexe em dado de todo mundo e fica permanentemente alcançável,
 * um secret vazado sozinho não pode mais ser suficiente.
 */
app.post('/api/admin/migrate-images', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireAdmin(req, db)
  if (auth instanceof Response) return auth

  const secret = c.env.BOOTSTRAP_SECRET
  if (!secret) return jsonResponse({ error: 'BOOTSTRAP_SECRET não configurada' }, { status: 500 })
  const provided = c.req.header('x-bootstrap-secret')
  if (!provided || !secretEquals(provided, secret)) {
    return jsonResponse({ error: 'unauthorized' }, { status: 401 })
  }

  let profilesMigrated = 0
  let postsMigrated = 0
  let communityPostsMigrated = 0
  let imagesMigrated = 0

  try {
    const profiles = await db
      .select({ id: profile.id, userId: profile.userId, avatarUrl: profile.avatarUrl, coverUrl: profile.coverUrl })
      .from(profile)
    for (const p of profiles) {
      if (!p.userId) continue
      const updates: { avatarUrl?: string; coverUrl?: string } = {}
      if (p.avatarUrl?.startsWith('data:image')) {
        const url = await migrateDataUrlToR2(c.env, p.userId, p.avatarUrl)
        if (url) {
          updates.avatarUrl = url
          imagesMigrated++
        }
      }
      if (p.coverUrl?.startsWith('data:image')) {
        const url = await migrateDataUrlToR2(c.env, p.userId, p.coverUrl)
        if (url) {
          updates.coverUrl = url
          imagesMigrated++
        }
      }
      if (Object.keys(updates).length > 0) {
        await db.update(profile).set(updates).where(eq(profile.id, p.id))
        profilesMigrated++
      }
    }

    const allPosts = await db.select({ id: posts.id, userId: posts.userId, images: posts.images }).from(posts)
    for (const post of allPosts) {
      if (!post.userId) continue
      const imgs = (post.images as string[] | null) ?? []
      if (imgs.length === 0) continue
      let changed = false
      const next: string[] = []
      for (const img of imgs) {
        if (img.startsWith('data:image')) {
          const url = await migrateDataUrlToR2(c.env, post.userId, img)
          if (url) {
            next.push(url)
            changed = true
            imagesMigrated++
            continue
          }
        }
        next.push(img)
      }
      if (changed) {
        await db.update(posts).set({ images: next }).where(eq(posts.id, post.id))
        postsMigrated++
      }
    }

    const allCommunityPosts = await db
      .select({ id: communityPosts.id, userId: communityPosts.userId, images: communityPosts.images })
      .from(communityPosts)
    for (const post of allCommunityPosts) {
      const imgs = (post.images as string[] | null) ?? []
      if (imgs.length === 0) continue
      let changed = false
      const next: string[] = []
      for (const img of imgs) {
        if (img.startsWith('data:image')) {
          const url = await migrateDataUrlToR2(c.env, post.userId, img)
          if (url) {
            next.push(url)
            changed = true
            imagesMigrated++
            continue
          }
        }
        next.push(img)
      }
      if (changed) {
        await db.update(communityPosts).set({ images: next }).where(eq(communityPosts.id, post.id))
        communityPostsMigrated++
      }
    }

    return jsonResponse({ profilesMigrated, postsMigrated, communityPostsMigrated, imagesMigrated })
  } catch (err) {
    console.error('admin-migrate-images error', err)
    return jsonResponse({ error: 'internal error', profilesMigrated, postsMigrated, communityPostsMigrated, imagesMigrated }, { status: 500 })
  }
})

export default app
