import type { Env } from '../env'

const IMAGE_URL_PREFIX = '/api/images/'

function extractKey(url: string | null | undefined): string | null {
  if (!url || !url.startsWith(IMAGE_URL_PREFIX)) return null
  return url.slice(IMAGE_URL_PREFIX.length)
}

/** Apaga uma imagem hospedada no R2 (no-op se a URL não for do R2 — ex: base64 antigo ainda não migrado). */
export async function deleteR2Image(env: Env, url: string | null | undefined): Promise<void> {
  const key = extractKey(url)
  if (!key) return
  await env.IMAGES.delete(key)
}

/** Apaga várias imagens do R2 de uma vez, ignorando as que não são do R2. */
export async function deleteR2Images(env: Env, urls: (string | null | undefined)[]): Promise<void> {
  const keys = urls.map(extractKey).filter((k): k is string => k !== null)
  if (keys.length > 0) await env.IMAGES.delete(keys)
}

/** Converte um data URL base64 em objeto no R2, prefixado pelo dono — usado na migração de imagens antigas. */
export async function migrateDataUrlToR2(env: Env, userId: number, dataUrl: string): Promise<string | null> {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  const [, contentType, base64] = match

  let binary: string
  try {
    binary = atob(base64)
  } catch {
    return null
  }
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'
  const key = `${userId}/${crypto.randomUUID()}.${ext}`
  await env.IMAGES.put(key, bytes, { httpMetadata: { contentType } })
  return `${IMAGE_URL_PREFIX}${key}`
}
