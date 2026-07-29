import type { Context } from '@netlify/functions'
import { checkAuth, jsonResponse } from './_auth'

export default async (req: Request, _context: Context) => {
  const authError = checkAuth(req)
  if (authError) return authError
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  const publicKey = process.env.VAPID_PUBLIC_KEY
  if (!publicKey) return jsonResponse({ error: 'VAPID_PUBLIC_KEY não configurada' }, { status: 500 })
  return jsonResponse({ publicKey })
}
