import { Hono } from 'hono'
import { getDb } from '../shared/db'
import { jsonResponse, requireUser } from '../shared/auth'
import { checkNsfw } from '../shared/nsfwCheck'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024 // 8MB — bem acima do que o cropper do cliente gera, só uma trava de sanidade
export const MAX_IMAGES_PER_ACCOUNT = 30 // proteção contra abuso, não é uma "cota justa" — a média real fica bem abaixo disso

app.post('/api/images', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const contentType = req.headers.get('content-type') ?? ''
  if (!ALLOWED_TYPES.has(contentType)) {
    return jsonResponse({ error: 'tipo de imagem não suportado' }, { status: 400 })
  }

  const body = await req.arrayBuffer()
  if (body.byteLength === 0) return jsonResponse({ error: 'arquivo vazio' }, { status: 400 })
  if (body.byteLength > MAX_UPLOAD_BYTES) return jsonResponse({ error: 'imagem muito grande' }, { status: 413 })

  const nsfw = await checkNsfw(c.env, body, contentType)
  if (nsfw.flagged) {
    return jsonResponse({ error: 'Essa imagem parece conter conteúdo adulto/nudez e não pode ser usada aqui.' }, { status: 422 })
  }

  const existing = await c.env.IMAGES.list({ prefix: `${user.id}/`, limit: MAX_IMAGES_PER_ACCOUNT })
  if (existing.objects.length >= MAX_IMAGES_PER_ACCOUNT) {
    return jsonResponse(
      { error: `limite de ${MAX_IMAGES_PER_ACCOUNT} imagens por conta atingido — apague fotos antigas pra liberar espaço` },
      { status: 403 },
    )
  }

  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'
  const key = `${user.id}/${crypto.randomUUID()}.${ext}`

  await c.env.IMAGES.put(key, body, { httpMetadata: { contentType } })

  return jsonResponse({ url: `/api/images/${key}` }, { status: 201 })
})

// Apaga uma imagem que o próprio usuário subiu mas nunca chegou a usar num post/perfil de verdade
// (removida do preview do composer antes de postar, ou o composer foi fechado sem postar) — sem isso
// esses arquivos ficam órfãos no R2 pra sempre e ainda contam pro limite de 30 por conta.
app.delete('/api/images/*', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  const key = c.req.path.replace(/^\/api\/images\//, '')
  // a key sempre começa com "<userId>/" — só dono apaga a própria imagem.
  if (!key.startsWith(`${user.id}/`)) return jsonResponse({ error: 'forbidden' }, { status: 403 })

  await c.env.IMAGES.delete(key)
  return jsonResponse({ ok: true })
})

// exige sessão (não autorização por dono/post ainda — isso pediria rastrear a qual post/perfil cada
// imagem pertence, escopo maior) — mas fecha o caso de qualquer um sem conta nenhuma, ou já
// deslogado/banido, continuar acessando uma URL de imagem que vazou por aí pra sempre.
app.get('/api/images/*', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth

  const key = c.req.path.replace(/^\/api\/images\//, '')
  const object = await c.env.IMAGES.get(key)
  if (!object) return new Response('not found', { status: 404 })

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('cache-control', 'public, max-age=31536000, immutable')

  return new Response(object.body, { headers })
})

export default app
