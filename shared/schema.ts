import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  date,
  doublePrecision,
} from 'drizzle-orm/pg-core'

export const profile = pgTable('profile', {
  id: serial('id').primaryKey(),
  displayName: text('display_name').notNull().default(''),
  pronouns: text('pronouns').notNull().default(''),
  avatarUrl: text('avatar_url'),
  transitionStartDate: date('transition_start_date'),
  timezone: text('timezone').notNull().default('America/Sao_Paulo'),
  themeAccent: text('theme_accent').notNull().default('#7fd4e8'),
  themeAccent2: text('theme_accent_2').notNull().default('#7fd4e8'),
  themeMode: text('theme_mode').notNull().default('dark'), // 'light' | 'dark'
  contentPreference: text('content_preference').notNull().default('feminine'), // 'feminine' | 'masculine' | 'combined'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const medications = pgTable('medications', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  doseAmount: text('dose_amount').notNull(),
  doseUnit: text('dose_unit').notNull(),
  route: text('route').notNull(), // 'oral' | 'injection' | 'patch' | 'gel' | 'other'
  frequencyType: text('frequency_type').notNull(), // 'daily' | 'every_n_days' | 'specific_days'
  // daily: {} | every_n_days: { intervalDays: number, anchorDate: string } | specific_days: { days: number[] } (0=Sun..6=Sat)
  frequencyValue: jsonb('frequency_value').notNull().default({}),
  preferredTime: text('preferred_time').notNull(), // 'HH:MM' local time
  notes: text('notes'),
  active: boolean('active').notNull().default(true),
  remindersEnabled: boolean('reminders_enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const doseLogs = pgTable('dose_logs', {
  id: serial('id').primaryKey(),
  medicationId: integer('medication_id')
    .notNull()
    .references(() => medications.id, { onDelete: 'cascade' }),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  takenAt: timestamp('taken_at', { withTimezone: true }),
  status: text('status').notNull().default('pending'), // 'pending' | 'taken' | 'skipped' | 'missed'
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(), // 'mood' | 'symptom'
  label: text('label').notNull(),
  emoji: text('emoji'),
  color: text('color'),
  isCustom: boolean('is_custom').notNull().default(false),
})

export const moodEntries = pgTable('mood_entries', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  moodTagIds: jsonb('mood_tag_ids').notNull().default([]), // number[]
  symptomTagIds: jsonb('symptom_tag_ids').notNull().default([]), // number[]
  energyLevel: integer('energy_level'), // 1-5
  libidoLevel: integer('libido_level'), // 1-5
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const measurements = pgTable('measurements', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(), // ex: 'bust', 'waist', 'hips', 'chest', 'shoulders', 'weight'...
  value: doublePrecision('value').notNull(),
  unit: text('unit').notNull(), // 'cm' | 'kg' | '%'
  date: date('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: serial('id').primaryKey(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const unlockedAchievements = pgTable('unlocked_achievements', {
  id: serial('id').primaryKey(),
  achievementKey: text('achievement_key').notNull().unique(),
  unlockedAt: timestamp('unlocked_at', { withTimezone: true }).notNull().defaultNow(),
})
