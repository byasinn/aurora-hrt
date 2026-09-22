import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { profile, posts, communityPosts } from '../../shared/schema'
import { jsonResponse, requireAdmin, secretEquals } from '../shared/auth'
import { deleteR2Image, deleteR2Images } from '../shared/images'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

/**
 * Apaga TODAS as imagens existentes (avatar, capa, fotos de post pessoal e de comunidade) —
 * do R2 e das referências no banco. Usado pra resetar antes de lançar de vez pros usuários.
 * Não toca em base64 antigo que não migrou (esses só ficam null/[] direto, não tem R2 pra apagar).
 *
 * Destrutivo e irreversível — por isso exige as DUAS coisas, não só uma: sessão de admin válida
 * (não dá pra disparar só sabendo um segredo que pode vazar) E o BOOTSTRAP_SECRET (não dá pra
 * disparar só com uma sessão de admin comprometida via XSS/CSRF, sem também ter o segredo).
 */
app.post('/api/admin/wipe-images', async (c) => {
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

  let profilesWiped = 0
  let postsWiped = 0
  let communityPostsWiped = 0

  try {
    const profiles = await db.select({ id: profile.id, avatarUrl: profile.avatarUrl, coverUrl: profile.coverUrl }).from(profile)
    const profilesToWipe = profiles.filter((p) => p.avatarUrl || p.coverUrl)
    await Promise.all(
      profilesToWipe.map(async (p) => {
        await Promise.all([deleteR2Image(c.env, p.avatarUrl), deleteR2Image(c.env, p.coverUrl)])
        await db.update(profile).set({ avatarUrl: null, coverUrl: null }).where(eq(profile.id, p.id))
      }),
    )
    profilesWiped = profilesToWipe.length

    const allPosts = await db.select({ id: posts.id, images: posts.images }).from(posts)
    const postsToWipe = allPosts.filter((post) => ((post.images as string[] | null) ?? []).length > 0)
    await Promise.all(
      postsToWipe.map(async (post) => {
        await deleteR2Images(c.env, (post.images as string[] | null) ?? [])
        await db.update(posts).set({ images: [] }).where(eq(posts.id, post.id))
      }),
    )
    postsWiped = postsToWipe.length

    const allCommunityPosts = await db.select({ id: communityPosts.id, images: communityPosts.images }).from(communityPosts)
    const communityPostsToWipe = allCommunityPosts.filter((post) => ((post.images as string[] | null) ?? []).length > 0)
    await Promise.all(
      communityPostsToWipe.map(async (post) => {
        await deleteR2Images(c.env, (post.images as string[] | null) ?? [])
        await db.update(communityPosts).set({ images: [] }).where(eq(communityPosts.id, post.id))
      }),
    )
    communityPostsWiped = communityPostsToWipe.length

    return jsonResponse({ profilesWiped, postsWiped, communityPostsWiped })
  } catch (err) {
    console.error('admin-wipe-images error', err)
    return jsonResponse({ error: 'internal error', profilesWiped, postsWiped, communityPostsWiped }, { status: 500 })
  }
})

export default app
