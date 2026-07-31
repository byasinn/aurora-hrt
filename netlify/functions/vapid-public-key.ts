import type { Context } from '@netlify/functions'
import { getDb } from './_shared/db'
import { jsonResponse, requireUser } from './_shared/auth'

export default async (req: Request, _context: Context) => {
  const db = getDb()
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  const publicKey = process.env.VAPID_PUBLIC_KEY
  if (!publicKey) return jsonResponse({ error: 'VAPID_PUBLIC_KEY não configurada' }, { status: 500 })
  return jsonResponse({ publicKey })
}
