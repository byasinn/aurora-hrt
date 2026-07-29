import type {
  profile,
  medications,
  doseLogs,
  tags,
  moodEntries,
  pushSubscriptions,
  unlockedAchievements,
} from './schema'

export type Profile = typeof profile.$inferSelect
export type ProfileInput = Partial<Omit<typeof profile.$inferInsert, 'id' | 'createdAt'>>

export type MedicationRoute = 'oral' | 'injection' | 'patch' | 'gel' | 'other'
export type FrequencyType = 'daily' | 'every_n_days' | 'specific_days'

export type FrequencyValue =
  | Record<string, never>
  | { intervalDays: number; anchorDate: string }
  | { days: number[] }

export type Medication = typeof medications.$inferSelect
export type MedicationInput = Omit<typeof medications.$inferInsert, 'id' | 'createdAt'>

export type DoseStatus = 'pending' | 'taken' | 'skipped' | 'missed'
export type DoseLog = typeof doseLogs.$inferSelect
export type DoseLogInput = Omit<typeof doseLogs.$inferInsert, 'id' | 'createdAt'>

export type TagType = 'mood' | 'symptom'
export type Tag = typeof tags.$inferSelect
export type TagInput = Omit<typeof tags.$inferInsert, 'id'>

export type MoodEntry = typeof moodEntries.$inferSelect
export type MoodEntryInput = Omit<typeof moodEntries.$inferInsert, 'id' | 'createdAt'>

export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect
export type PushSubscriptionInput = Omit<typeof pushSubscriptions.$inferInsert, 'id' | 'createdAt'>

export type UnlockedAchievement = typeof unlockedAchievements.$inferSelect

export interface AchievementDef {
  key: string
  title: string
  description: string
  icon: string
}
