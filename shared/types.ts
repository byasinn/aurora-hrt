import type {
  profile,
  medications,
  doseLogs,
  tags,
  moodEntries,
  measurements,
  labResults,
  posts,
  routines,
  routineLogs,
  messages,
  pushSubscriptions,
  unlockedAchievements,
} from './schema'

export type Profile = typeof profile.$inferSelect
export type ProfileInput = Partial<Omit<typeof profile.$inferInsert, 'id' | 'createdAt'>>

export type TextStyle = 'feminine' | 'masculine'
export type ContentPreference = 'feminine' | 'masculine' | 'combined'
export type AppModule = 'medications' | 'mood' | 'calendar' | 'measurements'
export const ALL_APP_MODULES: AppModule[] = ['medications', 'mood', 'calendar', 'measurements']

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

export type MeasurementType =
  | 'weight'
  | 'bust'
  | 'waist'
  | 'hips'
  | 'thigh'
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'body_fat'
  | 'height'
export type Measurement = typeof measurements.$inferSelect
export type MeasurementInput = Omit<typeof measurements.$inferInsert, 'id' | 'createdAt'>

export type LabType =
  | 'estradiol'
  | 'testosterone_total'
  | 'testosterone_free'
  | 'prolactin'
  | 'lh'
  | 'fsh'
  | 'shbg'
  | 'potassium'
  | 'custom'
export type LabResult = typeof labResults.$inferSelect
export type LabResultInput = Omit<typeof labResults.$inferInsert, 'id' | 'createdAt'>

export type Post = typeof posts.$inferSelect
export type PostInput = Omit<typeof posts.$inferInsert, 'id' | 'createdAt'>

export type RoutineType = 'checkbox' | 'counter'
export type Routine = typeof routines.$inferSelect
export type RoutineInput = Omit<typeof routines.$inferInsert, 'id' | 'createdAt'>
export type RoutineLog = typeof routineLogs.$inferSelect
export type RoutineLogInput = Omit<typeof routineLogs.$inferInsert, 'id' | 'createdAt'>

export type Message = typeof messages.$inferSelect
export type MessageInput = Omit<typeof messages.$inferInsert, 'id' | 'createdAt'>

export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect
export type PushSubscriptionInput = Omit<typeof pushSubscriptions.$inferInsert, 'id' | 'createdAt'>

export type UnlockedAchievement = typeof unlockedAchievements.$inferSelect

export interface AchievementDef {
  key: string
  title: string
  description: string
  icon: string
}
