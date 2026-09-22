import { Hono } from 'hono'
import { eq, or, isNull } from 'drizzle-orm'
import { getDb } from '../shared/db'
import {
  profile,
  medications,
  doseLogs,
  moodEntries,
  measurements,
  labResults,
  tags,
  unlockedAchievements,
} from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import type { Env } from '../env'

const app = new Hono<{ Bindings: Env }>()

app.all('/api/export-data', async (c) => {
  const req = c.req.raw
  const db = getDb(c.env)
  const auth = await requireUser(req, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const [
      profileRows,
      medicationRows,
      doseLogRows,
      moodRows,
      measurementRows,
      labRows,
      tagRows,
      achievementRows,
    ] = await Promise.all([
      db.select().from(profile).where(eq(profile.userId, user.id)),
      db.select().from(medications).where(eq(medications.userId, user.id)),
      db.select().from(doseLogs).where(eq(doseLogs.userId, user.id)),
      db.select().from(moodEntries).where(eq(moodEntries.userId, user.id)),
      db.select().from(measurements).where(eq(measurements.userId, user.id)),
      db.select().from(labResults).where(eq(labResults.userId, user.id)),
      db.select().from(tags).where(or(isNull(tags.userId), eq(tags.userId, user.id))),
      db.select().from(unlockedAchievements).where(eq(unlockedAchievements.userId, user.id)),
    ])

    return jsonResponse(
      {
        exportedAt: new Date().toISOString(),
        version: 1,
        profile: profileRows,
        medications: medicationRows,
        doseLogs: doseLogRows,
        moodEntries: moodRows,
        measurements: measurementRows,
        labResults: labRows,
        tags: tagRows,
        unlockedAchievements: achievementRows,
      },
      {
        headers: {
          'content-disposition': `attachment; filename="aurora-backup-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      },
    )
  } catch (err) {
    console.error('export-data function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

export default app
