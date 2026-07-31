import type { Context } from '@netlify/functions'
import { getDb } from './_shared/db'
import { getSessionUser, jsonResponse } from './_shared/auth'

export default async (req: Request, _context: Context) => {
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  const db = getDb()
  const user = await getSessionUser(req, db)
  if (!user) return jsonResponse({ error: 'unauthorized' }, { status: 401 })
  return jsonResponse(user)
}
