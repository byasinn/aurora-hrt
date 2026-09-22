export class ApiError extends Error {
  status: number
  code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let message = text || res.statusText
    let code: string | undefined
    try {
      const parsed = JSON.parse(text) as { error?: string; code?: string }
      if (parsed.error) message = parsed.error
      code = parsed.code
    } catch {
      // corpo não era JSON, mantém o texto cru
    }
    throw new ApiError(res.status, message, code)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}

/** Sobe um blob de imagem pro R2 e devolve a URL curta — usa fetch cru, sem o content-type json do apiFetch. */
export async function uploadImage(blob: Blob): Promise<{ url: string }> {
  const res = await fetch('/api/images', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': blob.type },
    body: blob,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let message = text || res.statusText
    try {
      const parsed = JSON.parse(text) as { error?: string }
      if (parsed.error) message = parsed.error
    } catch {
      // corpo não era JSON
    }
    throw new ApiError(res.status, message)
  }

  return (await res.json()) as { url: string }
}

/** Apaga do R2 uma imagem que foi subida (ex: pelo cropper) mas descartada antes de virar post de
 * verdade — best-effort, chamador não precisa tratar falha (o pior caso é a imagem ficar órfã, igual
 * já ficava antes desse helper existir). */
export function deleteImage(url: string): void {
  if (!url.startsWith('/api/images/')) return
  fetch(url, { method: 'DELETE', credentials: 'same-origin' }).catch(() => {})
}
