import type { Context } from '@netlify/functions'

/**
 * Trava simples por passphrase (não é autenticação real — suficiente para v1
 * de uso pessoal). O client envia a passphrase no header x-app-passphrase.
 */
export function checkAuth(req: Request): Response | null {
  const expected = process.env.APP_PASSPHRASE
  if (!expected) {
    // Sem passphrase configurada no ambiente, não bloqueia (ex: dev local sem env var).
    return null
  }
  const provided = req.headers.get('x-app-passphrase')
  if (provided !== expected) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }
  return null
}

export function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
}

export type FnContext = Context
