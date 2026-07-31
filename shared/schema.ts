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
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // null se o login é só via Google
  googleId: text('google_id').unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(), // sha256(token) — nunca guarda o token puro
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const emailTokens = pgTable('email_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  type: text('type').notNull(), // 'verify_email' | 'reset_password'
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const profile = pgTable('profile', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }), // nullable até o backfill; depois vira NOT NULL
  displayName: text('display_name').notNull().default(''),
  pronouns: text('pronouns').notNull().default(''),
  avatarUrl: text('avatar_url'),
  transitionStartDate: date('transition_start_date'),
  timezone: text('timezone').notNull().default('America/Sao_Paulo'),
  themeAccent: text('theme_accent').notNull().default('#7fd4e8'),
  themeAccent2: text('theme_accent_2').notNull().default('#7fd4e8'),
  themeMode: text('theme_mode').notNull().default('dark'), // 'light' | 'dark'
  contentPreference: text('content_preference').notNull().default('feminine'), // 'feminine' | 'masculine' | 'combined'
  textStyle: text('text_style').notNull().default('feminine'), // 'feminine' | 'masculine'
  avatarIcon: text('avatar_icon'), // emoji key quando não há foto
  isOnHrt: boolean('is_on_hrt'),
  notOnMedsYet: boolean('not_on_meds_yet').notNull().default(false),
  appGoals: jsonb('app_goals').notNull().default([]), // string[]
  enabledModules: jsonb('enabled_modules')
    .notNull()
    .default(['medications', 'mood', 'calendar', 'measurements']), // string[]
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  showTipsOnHome: boolean('show_tips_on_home').notNull().default(true),
  bio: text('bio'),
  coverUrl: text('cover_url'),
  showStatsOnProfile: boolean('show_stats_on_profile').notNull().default(false), // substituído pelos 4 toggles abaixo
  shareAvgMood: boolean('share_avg_mood').notNull().default(false),
  shareLibido: boolean('share_libido').notNull().default(false),
  shareMedications: boolean('share_medications').notNull().default(false),
  shareHrtDuration: boolean('share_hrt_duration').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const medications = pgTable('medications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
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
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
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
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }), // null = tag padrão/global
  type: text('type').notNull(), // 'mood' | 'symptom'
  label: text('label').notNull(),
  emoji: text('emoji'),
  color: text('color'),
  isCustom: boolean('is_custom').notNull().default(false),
})

export const moodEntries = pgTable('mood_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
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
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // ex: 'bust', 'waist', 'hips', 'chest', 'shoulders', 'weight'...
  value: doublePrecision('value').notNull(),
  unit: text('unit').notNull(), // 'cm' | 'kg' | '%'
  date: date('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const labResults = pgTable('lab_results', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // ex: 'estradiol', 'testosterone_total', 'prolactin', 'custom'...
  label: text('label'), // rótulo livre quando type = 'custom'
  value: doublePrecision('value').notNull(),
  unit: text('unit').notNull(), // 'pg/mL' | 'ng/dL' | 'mIU/mL' ...
  date: date('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  text: text('text'),
  images: jsonb('images').notNull().default([]), // string[] data URLs
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const routines = pgTable('routines', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('✅'),
  type: text('type').notNull().default('checkbox'), // 'checkbox' | 'counter'
  targetCount: integer('target_count'), // usado quando type = 'counter'
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const routineLogs = pgTable('routine_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  routineId: integer('routine_id')
    .notNull()
    .references(() => routines.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  count: integer('count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  icon: text('icon').notNull().default('💜'),
  title: text('title').notNull(),
  body: text('body').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const unlockedAchievements = pgTable(
  'unlocked_achievements',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    achievementKey: text('achievement_key').notNull(),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('unlocked_achievements_user_key').on(table.userId, table.achievementKey)],
)

export const follows = pgTable(
  'follows',
  {
    id: serial('id').primaryKey(),
    followerId: integer('follower_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    followingId: integer('following_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('follows_pair').on(table.followerId, table.followingId)],
)

export const postLikes = pgTable(
  'post_likes',
  {
    id: serial('id').primaryKey(),
    postId: integer('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('post_likes_pair').on(table.postId, table.userId)],
)

export const postComments = pgTable('post_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const directMessages = pgTable('direct_messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  recipientId: integer('recipient_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
