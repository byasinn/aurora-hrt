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
  index,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // null se o login é só via Google
  googleId: text('google_id').unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  isAdmin: boolean('is_admin').notNull().default(false),
  banned: boolean('banned').notNull().default(false),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  termsAcceptedAt: timestamp('terms_accepted_at', { withTimezone: true }),
  ageConfirmedAt: timestamp('age_confirmed_at', { withTimezone: true }), // declaração de "tenho 18+" no cadastro
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

export const profile = pgTable(
  'profile',
  {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }), // nullable até o backfill; depois vira NOT NULL
  username: text('username'), // @handle único, minúsculo — nullable até o backfill, depois vira NOT NULL
  usernameChangeCount: integer('username_change_count').notNull().default(0), // reseta a cada 30 dias
  usernameChangeWindowStart: timestamp('username_change_window_start', { withTimezone: true }),
  displayName: text('display_name').notNull().default(''),
  displayNameChangeCount: integer('display_name_change_count').notNull().default(0), // reseta a cada 30 dias
  displayNameChangeWindowStart: timestamp('display_name_change_window_start', { withTimezone: true }),
  pronouns: text('pronouns').notNull().default(''),
  avatarUrl: text('avatar_url'),
  transitionStartDate: date('transition_start_date'),
  timezone: text('timezone').notNull().default('America/Sao_Paulo'),
  themeAccent: text('theme_accent').notNull().default('#7fd4e8'),
  themeAccent2: text('theme_accent_2').notNull().default('#7fd4e8'),
  themeMode: text('theme_mode').notNull().default('dark'), // 'light' | 'dark'
  contentPreference: text('content_preference').notNull().default('feminine'), // 'feminine' | 'masculine' | 'combined'
  textStyle: text('text_style').notNull().default('feminine'), // 'feminine' | 'masculine' | 'neutral'
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
  isPrivate: boolean('is_private').notNull().default(false), // seguir vira pedido pendente até aprovação
  appIconVariant: text('app_icon_variant').notNull().default('default'), // qual /icons/variants/* usar no manifest
  equippedTitleSfw: text('equipped_title_sfw'), // key de src/lib/titles.ts SFW_TITLES
  showTitlesSfw: boolean('show_titles_sfw').notNull().default(false),
  showAchievementsOnProfile: boolean('show_achievements_on_profile').notNull().default(false),
  showTrophiesOnProfile: boolean('show_trophies_on_profile').notNull().default(false),
  postsCollageStyle: text('posts_collage_style').notNull().default('masonry'), // 'grid' | 'row' | 'masonry'
  isVerified: boolean('is_verified').notNull().default(false), // selo de verificado, concedido por admin
  externalLinks: jsonb('external_links').notNull().default([]), // { label: string, url: string }[]
  workoutsEnabled: boolean('workouts_enabled').notNull().default(false),
  cycleTrackingEnabled: boolean('cycle_tracking_enabled').notNull().default(false),
  cyclePaused: boolean('cycle_paused').notNull().default(false), // pausa previsões (ex: ciclo instável por HRT) sem perder o histórico
  averageCycleLength: integer('average_cycle_length').notNull().default(28),
  averagePeriodLength: integer('average_period_length').notNull().default(5),
  intimateTrackingEnabled: boolean('intimate_tracking_enabled').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('profile_username_idx').on(table.username)],
)

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
  preferredTimes: jsonb('preferred_times').notNull().default([]).$type<string[]>(), // 'HH:MM' local, uma ou mais doses por dia
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

export const tags = pgTable(
  'tags',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }), // null = tag padrão/global
    type: text('type').notNull(), // 'mood' | 'symptom'
    label: text('label').notNull(),
    emoji: text('emoji'),
    color: text('color'),
    isCustom: boolean('is_custom').notNull().default(false),
  },
  // clicar rápido demais numa sugestão pontilhada (antes dela sumir da lista) criava uma tag
  // duplicada com o mesmo label a cada clique — isso fecha isso no banco. Não afeta as tags globais
  // (userId null), já que NULL nunca colide com NULL num índice único; e como o endpoint público só
  // cria tags com userId preenchido, isso nunca colide com elas de qualquer forma.
  (table) => [uniqueIndex('tags_user_type_label').on(table.userId, table.type, table.label)],
)

export const moodEntries = pgTable(
  'mood_entries',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    moodTagIds: jsonb('mood_tag_ids').notNull().default([]), // number[]
    symptomTagIds: jsonb('symptom_tag_ids').notNull().default([]), // number[]
    energyLevel: integer('energy_level'), // 1-5
    libidoLevel: integer('libido_level'), // 1-5
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  // sem isso, clique duplo (ou o delay entre salvar e o refetch atualizar a tela) cria dois
  // check-ins pro mesmo dia — igual já foi corrigido em cycle_logs/intimate_logs/day_notes.
  (table) => [uniqueIndex('mood_entries_user_date').on(table.userId, table.date)],
)

// Registro de ciclo menstrual — opt-in via profile.cycleTrackingEnabled, um registro por dia por usuário.
export const cycleLogs = pgTable(
  'cycle_logs',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    flow: text('flow'), // null | 'spotting' | 'light' | 'medium' | 'heavy'
    symptoms: jsonb('symptoms').notNull().default([]), // string[]
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('cycle_logs_user_date').on(table.userId, table.date)],
)

// Registro de atividade íntima — opt-in via profile.intimateTrackingEnabled, independente do ciclo.
export const intimateLogs = pgTable(
  'intimate_logs',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    types: jsonb('types').notNull().default([]), // ('solo' | 'partner' | 'toy')[]
    penetration: text('penetration'), // null | 'none' | 'vaginal' | 'anal'
    protection: boolean('protection'),
    pain: text('pain'), // null | 'none' | 'light' | 'strong'
    orgasm: boolean('orgasm'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('intimate_logs_user_date').on(table.userId, table.date)],
)

// Anotação livre por dia — independente de humor/ciclo/atividade íntima, parte do hub "Registrar dia".
export const dayNotes = pgTable(
  'day_notes',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    note: text('note').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('day_notes_user_date').on(table.userId, table.date)],
)

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

export const posts = pgTable(
  'posts',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    text: text('text'),
    images: jsonb('images').notNull().default([]), // string[] data URLs
    fontStyle: text('font_style'), // null | 'serif' | 'handwritten' | 'display'
    cardStyle: boolean('card_style').notNull().default(false),
    cardColor: text('card_color'), // snapshot da cor de tema do autor no momento do post
    cardColor2: text('card_color2'),
    // repost — quando preenchido, esse post é um "repost" apontando pro original (post ou post de comunidade),
    // sem duplicar conteúdo: texto/imagens do repost em si ficam vazios, o feed resolve o original na hora de montar.
    repostOfKind: text('repost_of_kind'), // null | 'post' | 'community'
    repostOfId: integer('repost_of_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  // NULL nunca colide com NULL num índice único, então isso não afeta posts normais (as duas colunas
  // ficam null) — só impede duas linhas com o mesmo (userId, repostOfKind, repostOfId) preenchidos,
  // fechando a corrida de clique duplo no botão de repostar.
  (table) => [uniqueIndex('posts_repost_pair').on(table.userId, table.repostOfKind, table.repostOfId)],
)

export const routines = pgTable('routines', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('✅'),
  type: text('type').notNull().default('checkbox'), // 'checkbox' | 'counter' | 'timer'
  targetCount: integer('target_count'), // counter: unidades; timer: segundos
  daysOfWeek: jsonb('days_of_week'), // number[] (0=dom..6=sáb) | null = todo dia
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

// Programa de treino opcional (ativado em profile.workoutsEnabled) — cada dia tem seus próprios
// exercícios e dias da semana, permitindo splits tipo "Glúteos seg/qua/sex" + "Pernas ter/qui".
export const workoutPrograms = pgTable('workout_programs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('dumbbell'),
  templateKey: text('template_key'), // preset de origem (src/lib/workoutTemplates.ts), null se criado do zero
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const workoutDays = pgTable('workout_days', {
  id: serial('id').primaryKey(),
  programId: integer('program_id')
    .notNull()
    .references(() => workoutPrograms.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  daysOfWeek: jsonb('days_of_week').notNull().default([]), // number[] 0=dom..6=sáb
  exercises: jsonb('exercises').notNull().default([]), // { name, sets, reps }[]
  sortOrder: integer('sort_order').notNull().default(0),
})

export const workoutLogs = pgTable(
  'workout_logs',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workoutDayId: integer('workout_day_id')
      .notNull()
      .references(() => workoutDays.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    durationSeconds: integer('duration_seconds'),
    notes: text('notes'),
    setLogs: jsonb('set_logs').notNull().default([]), // { name, sets: { weight, reps, done }[] }[] — desempenho real
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('workout_logs_day_date').on(table.workoutDayId, table.date)],
)

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  icon: text('icon').notNull().default('heart'),
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

export const unlockedTitles = pgTable(
  'unlocked_titles',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    titleKey: text('title_key').notNull(),
    track: text('track').notNull(), // 'sfw' | 'special'
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('unlocked_titles_user_key').on(table.userId, table.titleKey)],
)

// Denúncias de usuário/post/comentário — qualquer um pode denunciar, só admin vê/revisa.
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  reporterId: integer('reporter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  targetType: text('target_type').notNull(), // 'user' | 'post' | 'community_post' | 'comment' | 'community_comment'
  targetId: integer('target_id').notNull(),
  reason: text('reason'),
  status: text('status').notNull().default('pending'), // 'pending' | 'reviewed' | 'dismissed'
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Registro do que um admin apagou (post/comentário de outra conta) — guarda um retrato do
// conteúdo antes de sumir, pra dar transparência/auditoria de moderação.
export const moderationLog = pgTable('moderation_log', {
  id: serial('id').primaryKey(),
  actorId: integer('actor_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // 'delete_post' | 'delete_community_post' | 'delete_comment' | 'delete_community_comment'
  targetUserId: integer('target_user_id'), // dono do conteúdo removido
  snapshot: jsonb('snapshot').notNull().default({}), // { text, images? }
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const unlockedTrophies = pgTable(
  'unlocked_trophies',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    trophyKey: text('trophy_key').notNull(),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('unlocked_trophies_user_key').on(table.userId, table.trophyKey)],
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
    status: text('status').notNull().default('accepted'), // 'pending' | 'accepted' — pending só quando o alvo é privado
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('follows_pair').on(table.followerId, table.followingId)],
)

export const blocks = pgTable(
  'blocks',
  {
    id: serial('id').primaryKey(),
    blockerId: integer('blocker_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    blockedId: integer('blocked_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('blocks_pair').on(table.blockerId, table.blockedId)],
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
  parentCommentId: integer('parent_comment_id').references((): AnyPgColumn => postComments.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const postCommentLikes = pgTable(
  'post_comment_likes',
  {
    id: serial('id').primaryKey(),
    commentId: integer('comment_id')
      .notNull()
      .references(() => postComments.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('post_comment_likes_pair').on(table.commentId, table.userId)],
)

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

// Múltiplas comunidades — quem administra é quem tem users.isAdmin (sem papel por comunidade ainda).
export const communities = pgTable('communities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon').notNull().default('heart'),
  tags: jsonb('tags').notNull().default([]), // string[] interesses
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const communityMembers = pgTable(
  'community_members',
  {
    id: serial('id').primaryKey(),
    communityId: integer('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('community_members_pair').on(table.communityId, table.userId)],
)

// Posts DENTRO da comunidade (tipo Reddit) — diferente dos posts pessoais do perfil.
// Só quem é membro da comunidade vê esses posts (no Explorar e na própria comunidade).
export const communityPosts = pgTable('community_posts', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id')
    .notNull()
    .references(() => communities.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  text: text('text'),
  images: jsonb('images').notNull().default([]), // string[] data URLs
  fontStyle: text('font_style'),
  cardStyle: boolean('card_style').notNull().default(false),
  cardColor: text('card_color'),
  cardColor2: text('card_color2'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const communityPostLikes = pgTable(
  'community_post_likes',
  {
    id: serial('id').primaryKey(),
    postId: integer('post_id')
      .notNull()
      .references(() => communityPosts.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('community_post_likes_pair').on(table.postId, table.userId)],
)

export const communityPostComments = pgTable('community_post_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .notNull()
    .references(() => communityPosts.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  parentCommentId: integer('parent_comment_id').references(
    (): AnyPgColumn => communityPostComments.id,
    { onDelete: 'cascade' },
  ),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const communityPostCommentLikes = pgTable(
  'community_post_comment_likes',
  {
    id: serial('id').primaryKey(),
    commentId: integer('comment_id')
      .notNull()
      .references(() => communityPostComments.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('community_post_comment_likes_pair').on(table.commentId, table.userId)],
)

// Aviso de "o que mudou" mostrado uma vez por versão — o app guarda no localStorage do dispositivo
// até que número de versão já foi visto, então criar uma linha nova aqui é o suficiente pra avisar
// todo mundo de novo, sem precisar mexer em código (só o admin, via painel).
export const appAnnouncements = pgTable('app_announcements', {
  id: serial('id').primaryKey(),
  version: text('version').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Página de tópico do Explorar (ex: "Trans Fem", "Moda", "Notícias trans") — agrupa posts
// automáticos vindos de RSS/YouTube e permite às pessoas seguirem por interesse, sem precisar
// seguir uma conta específica. É a base do "grafo de interesses": conta -> segue tópico -> tópico
// serve de sinal pra sugestão de gente com interesse parecido (worker/shared/suggestions.ts).
export const topicPages = pgTable('topic_pages', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon').notNull().default('sparkles'), // chave do lucide-react (getCollectibleIcon)
  color: text('color').notNull().default('#7fd4e8'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Fonte de conteúdo (feed RSS/Atom, canal do YouTube via RSS) associada a uma página de tópico —
// o cron (worker/scheduled.ts) busca cada fonte ativa periodicamente e gera topicPosts novos.
export const contentSources = pgTable('content_sources', {
  id: serial('id').primaryKey(),
  topicPageId: integer('topic_page_id')
    .notNull()
    .references(() => topicPages.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  feedUrl: text('feed_url').notNull(),
  active: boolean('active').notNull().default(true),
  lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
  lastError: text('last_error'), // guarda o erro da última tentativa, pra debugar fonte quebrada
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Post automático "só link" — de propósito sem corpo de texto pesado, sem imagem própria no R2,
// só título/resumo/link/thumbnail pra não pesar o banco (pedido explícito: "apenas links").
export const topicPosts = pgTable(
  'topic_posts',
  {
    id: serial('id').primaryKey(),
    topicPageId: integer('topic_page_id')
      .notNull()
      .references(() => topicPages.id, { onDelete: 'cascade' }),
    sourceId: integer('source_id').references(() => contentSources.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    url: text('url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    summary: text('summary'),
    sourceName: text('source_name'), // nome legível da fonte, independente do contentSources ainda existir
    publishedAt: timestamp('published_at', { withTimezone: true }),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
  },
  // evita reprocessar o mesmo item do feed a cada ciclo do cron — RSS feeds normalmente repetem os
  // mesmos itens em toda busca, só o topo muda.
  (table) => [uniqueIndex('topic_posts_source_url').on(table.sourceId, table.url)],
)

// Interesse — seguir um tópico sem seguir uma conta específica.
export const topicPageFollows = pgTable(
  'topic_page_follows',
  {
    id: serial('id').primaryKey(),
    topicPageId: integer('topic_page_id')
      .notNull()
      .references(() => topicPages.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('topic_page_follows_pair').on(table.topicPageId, table.userId)],
)

// Contador genérico de rate limit — uma linha por tentativa permitida dentro da janela.
// `key` é algo tipo "signup:1.2.3.4" ou "post:42". Linhas velhas são limpas pelo cron.
export const rateLimitHits = pgTable(
  'rate_limit_hits',
  {
    id: serial('id').primaryKey(),
    key: text('key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('rate_limit_hits_key_idx').on(table.key)],
)
