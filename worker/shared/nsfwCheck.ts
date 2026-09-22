import type { Env } from '../env'

export interface NsfwCheckResult {
  flagged: boolean
  reason?: string
}

/**
 * Verifica nudez/conteúdo adulto via Sightengine antes de aceitar um upload de imagem.
 * Se as chaves não estiverem configuradas (SIGHTENGINE_API_USER/SIGHTENGINE_API_SECRET),
 * não bloqueia nada (fail-open) — melhor do que derrubar upload por falta de config, mas
 * fica registrado no log do Worker pra não passar despercebido.
 * Também não bloqueia se a chamada pra Sightengine falhar (rede, limite de cota, etc.) —
 * um problema no serviço terceiro não deve travar o app inteiro.
 */
export async function checkNsfw(env: Env, imageBytes: ArrayBuffer, contentType: string): Promise<NsfwCheckResult> {
  const apiUser = env.SIGHTENGINE_API_USER
  const apiSecret = env.SIGHTENGINE_API_SECRET
  if (!apiUser || !apiSecret) {
    console.warn('SIGHTENGINE_API_USER/SIGHTENGINE_API_SECRET não configurados — pulando checagem de nudez')
    return { flagged: false }
  }

  try {
    const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'
    const form = new FormData()
    form.append('media', new Blob([imageBytes], { type: contentType }), `upload.${ext}`)
    form.append('models', 'nudity-2.1')
    form.append('api_user', apiUser)
    form.append('api_secret', apiSecret)

    const res = await fetch('https://api.sightengine.com/1.0/check.json', { method: 'POST', body: form })
    if (!res.ok) {
      console.error('sightengine request failed', res.status, await res.text().catch(() => ''))
      return { flagged: false }
    }

    const data = (await res.json()) as { nudity?: Record<string, unknown> }
    console.log('sightengine nudity result', JSON.stringify(data.nudity))

    const none = data.nudity?.none
    // "none" é a probabilidade de a imagem NÃO ter nudez — abaixo de 0.8 já é motivo pra barrar.
    // (fica logado acima pra confirmar o formato real da resposta na prática e ajustar se precisar)
    if (typeof none === 'number' && none < 0.8) {
      return { flagged: true, reason: 'conteúdo adulto detectado' }
    }
    return { flagged: false }
  } catch (err) {
    console.error('sightengine check error', err)
    return { flagged: false }
  }
}
