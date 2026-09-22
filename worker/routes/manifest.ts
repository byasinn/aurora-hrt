import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { profile } from '../../shared/schema'
import { getSessionUser } from '../shared/auth'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

export const ICON_VARIANTS = ['default', 'dourado', 'esmeralda', 'turquesa', 'lilas'] as const
const VALID_VARIANTS = new Set<string>(ICON_VARIANTS)

app.get('/api/manifest.webmanifest', async (c) => {
  const db = getDb(c.env)
  let variant = 'default'

  const user = await getSessionUser(c.req.raw, db)
  if (user) {
    const [row] = await db
      .select({ appIconVariant: profile.appIconVariant })
      .from(profile)
      .where(eq(profile.userId, user.id))
      .limit(1)
    if (row?.appIconVariant && VALID_VARIANTS.has(row.appIconVariant)) variant = row.appIconVariant
  }

  const iconPath = variant === 'default' ? '/icons' : `/icons/variants/${variant}`

  return new Response(
    JSON.stringify({
      name: 'Aurora',
      short_name: 'Aurora',
      description: 'Sua jornada de transição hormonal: doses, humor, medidas e exames num só lugar.',
      theme_color: '#F5A9B8',
      background_color: '#faf7f8',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: `${iconPath}/icon-192.png`, sizes: '192x192', type: 'image/png' },
        { src: `${iconPath}/icon-512.png`, sizes: '512x512', type: 'image/png' },
        { src: `${iconPath}/icon-512-maskable.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }),
    { headers: { 'content-type': 'application/manifest+json' } },
  )
})

export default app
