import type { Context } from '@netlify/functions'
import { getDb } from './_shared/db'
import { clearSessionCookie, deleteSession, jsonResponse } from './_shared/auth'

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  const cookie = req.headers.get('cookie') ?? ''
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/)
  if (match) {
    const db = getDb()
    await deleteSession(db, decodeURIComponent(match[1]))
  }

  return jsonResponse({ ok: true }, { headers: { 'set-cookie': clearSessionCookie() } })
}
