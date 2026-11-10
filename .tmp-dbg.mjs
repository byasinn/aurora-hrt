import { neon } from '@neondatabase/serverless'
import { createHash, randomBytes } from 'node:crypto'
const sql = neon(process.env.STAGING_DATABASE_URL)
const [u] = await sql`insert into users (email, email_verified) values (${`dbg-${randomBytes(4).toString('hex')}@example.invalid`}, true) returning id`
try {
  await sql`insert into profile (user_id, username, display_name, onboarding_completed) values (${u.id}, ${'dbg' + u.id}, 'D', true)`
  await sql`insert into chests (user_id, source, rarity, contents, opened_at) values (${u.id}, 'test:x', 'common', '{"brilho":600,"potions":0,"itemKey":null}', now())`
  const token = randomBytes(32).toString('hex')
  await sql`insert into sessions (id, user_id, expires_at) values (${createHash('sha256').update(token).digest('hex')}, ${u.id}, now() + interval '1 hour')`
  const r = await fetch('https://aurora-staging.inkcastro.workers.dev/api/shop/buy-potion', { method: 'POST', headers: { cookie: `session=${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ offerKey: 'potion-1' }) })
  console.log(r.status, (await r.text()).slice(0, 600))
} finally {
  await sql`delete from users where id=${u.id}`
}
