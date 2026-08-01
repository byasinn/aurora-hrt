import type {
  users,
  sessions,
  emailTokens,
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
  follows,
  postLikes,
  postComments,
  directMessages,
  tasks,
} from './schema'

export type User = typeof users.$inferSelect
export type PublicUser = Pick<User, 'id' | 'email' | 'emailVerified' | 'isAdmin' | 'createdAt'>
export type AdminUserSummary = Pick<User, 'id' | 'email' | 'emailVerified' | 'isAdmin' | 'banned' | 'createdAt'>
export type Session = typeof sessions.$inferSelect
export type EmailTokenType = 'verify_email' | 'reset_password'
export type EmailToken = typeof emailTokens.$inferSelect

export type Profile = typeof profile.$inferSelect
export type ProfileInput = Partial<Omit<typeof profile.$inferInsert, 'id' | 'userId' | 'createdAt'>>

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
export type MedicationInput = Omit<typeof medications.$inferInsert, 'id' | 'userId' | 'createdAt'>

export type DoseStatus = 'pending' | 'taken' | 'skipped' | 'missed'
export type DoseLog = typeof doseLogs.$inferSelect
export type DoseLogInput = Omit<typeof doseLogs.$inferInsert, 'id' | 'userId' | 'createdAt'>

export type TagType = 'mood' | 'symptom'
export type Tag = typeof tags.$inferSelect
export type TagInput = Omit<typeof tags.$inferInsert, 'id' | 'userId'>

export type MoodEntry = typeof moodEntries.$inferSelect
export type MoodEntryInput = Omit<typeof moodEntries.$inferInsert, 'id' | 'userId' | 'createdAt'>

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
  | 'flaccid_length'
  | 'erect_length'
export type Measurement = typeof measurements.$inferSelect
export type MeasurementInput = Omit<typeof measurements.$inferInsert, 'id' | 'userId' | 'createdAt'>

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
export type LabResultInput = Omit<typeof labResults.$inferInsert, 'id' | 'userId' | 'createdAt'>

export type Post = typeof posts.$inferSelect
export type PostInput = Omit<typeof posts.$inferInsert, 'id' | 'userId' | 'createdAt'>

export type RoutineType = 'checkbox' | 'counter' | 'timer'
export type Routine = typeof routines.$inferSelect
export type RoutineInput = Omit<typeof routines.$inferInsert, 'id' | 'userId' | 'createdAt'>
export type RoutineLog = typeof routineLogs.$inferSelect
export type RoutineLogInput = Omit<typeof routineLogs.$inferInsert, 'id' | 'userId' | 'createdAt'>

export type Task = typeof tasks.$inferSelect
export type TaskInput = Omit<typeof tasks.$inferInsert, 'id' | 'userId' | 'createdAt'>

export type Message = typeof messages.$inferSelect
export type MessageInput = Omit<typeof messages.$inferInsert, 'id' | 'userId' | 'createdAt'>

export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect
export type PushSubscriptionInput = Omit<typeof pushSubscriptions.$inferInsert, 'id' | 'userId' | 'createdAt'>

export type UnlockedAchievement = typeof unlockedAchievements.$inferSelect

export interface AchievementDef {
  key: string
  title: string
  description: string
  icon: string
}

export type Follow = typeof follows.$inferSelect
export type PostLike = typeof postLikes.$inferSelect

export type PostComment = typeof postComments.$inferSelect
export type PostCommentInput = Omit<typeof postComments.$inferInsert, 'id' | 'userId' | 'createdAt'>
export interface PostCommentWithAuthor extends PostComment {
  author: { userId: number; displayName: string; avatarUrl: string | null; avatarIcon: string | null }
}

export type DirectMessage = typeof directMessages.$inferSelect
export type DirectMessageInput = Omit<typeof directMessages.$inferInsert, 'id' | 'senderId' | 'readAt' | 'createdAt'>

export interface PublicUserSummary {
  userId: number
  displayName: string
  avatarUrl: string | null
  avatarIcon: string | null
  pronouns: string
  isFollowedByMe: boolean
}

export interface SharedMedicationSummary {
  name: string
  doseAmount: string
  doseUnit: string
  route: string
}

export interface UserProfileDetail extends PublicUserSummary {
  bio: string | null
  coverUrl: string | null
  followerCount: number
  followingCount: number
  avgMood: number | null
  avgLibido: number | null
  medications: SharedMedicationSummary[] | null
  hrtDurationDays: number | null
  posts: FeedPost[]
  targetNsfwMode: boolean
  kinks: string[] | null
}

export interface FeedPost extends Post {
  author: PublicUserSummary
  likeCount: number
  commentCount: number
  likedByMe: boolean
}

export interface MySocialStats {
  followerCount: number
  postsCount: number
  commentsCount: number
}

export interface DmThread {
  userId: number
  displayName: string
  avatarUrl: string | null
  avatarIcon: string | null
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}
