import type { Context } from '@netlify/functions'
import { getDb } from './_shared/db'
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
import { checkAuth, jsonResponse } from './_shared/auth'

export default async (req: Request, _context: Context) => {
  const authError = checkAuth(req)
  if (authError) return authError
  if (req.method !== 'GET') return jsonResponse({ error: 'method not allowed' }, { status: 405 })

  try {
    const db = getDb()
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
      db.select().from(profile),
      db.select().from(medications),
      db.select().from(doseLogs),
      db.select().from(moodEntries),
      db.select().from(measurements),
      db.select().from(labResults),
      db.select().from(tags),
      db.select().from(unlockedAchievements),
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
          'content-disposition': `attachment; filename="trans-track-backup-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      },
    )
  } catch (err) {
    console.error('export-data function error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
}
