import type {
  users,
  sessions,
  emailTokens,
  profile,
  medications,
  doseLogs,
  tags,
  moodEntries,
  cycleLogs,
  intimateLogs,
  dayNotes,
  measurements,
  labResults,
  posts,
  routines,
  routineLogs,
  messages,
  pushSubscriptions,
  unlockedAchievements,
  follows,
  blocks,
  postLikes,
  postComments,
  postCommentLikes,
  directMessages,
  workoutPrograms,
  workoutDays,
  workoutLogs,
  communities,
  communityMembers,
  communityPosts,
  communityPostComments,
  communityPostCommentLikes,
  unlockedTitles,
  unlockedTrophies,
  reports,
  moderationLog,
  appAnnouncements,
  topicPages,
  contentSources,
  topicPosts,
} from './schema'

export type User = typeof users.$inferSelect
export type PublicUser = Pick<User, 'id' | 'email' | 'emailVerified' | 'isAdmin' | 'createdAt'>
export type AdminUserSummary = Pick<User, 'id' | 'email' | 'emailVerified' | 'isAdmin' | 'banned' | 'createdAt'> & {
  isVerified: boolean
}

export type ReportTargetType = 'user' | 'post' | 'community_post' | 'comment' | 'community_comment'
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed'
export type Report = typeof reports.$inferSelect
export type ReportInput = { targetType: ReportTargetType; targetId: number; reason?: string | null }
export interface ReportWithDetails extends Report {
  reporterEmail: string
  targetPreview: string
}

export type ModerationLogEntry = typeof moderationLog.$inferSelect
export interface ModerationLogEntryWithDetails extends ModerationLogEntry {
  actorEmail: string
  targetEmail: string | null
}
export type AppAnnouncement = typeof appAnnouncements.$inferSelect
export type AppAnnouncementInput = Pick<typeof appAnnouncements.$inferInsert, 'version' | 'title' | 'body'>

export type TopicPage = typeof topicPages.$inferSelect
export interface TopicPageWithMeta extends TopicPage {
  isFollowedByMe: boolean
  postCount: number
}
export type ContentSource = typeof contentSources.$inferSelect
export type ContentSourceInput = Pick<typeof contentSources.$inferInsert, 'topicPageId' | 'name' | 'feedUrl'>
export type TopicPost = typeof topicPosts.$inferSelect
export type TopicPageInput = Pick<typeof topicPages.$inferInsert, 'slug' | 'name' | 'description' | 'icon' | 'color'>

export interface FollowSuggestion {
  userId: number
  username: string
  displayName: string
  avatarUrl: string | null
  avatarIcon: string | null
  pronouns: string
  isVerified: boolean
  sharedTopics: string[] // nomes dos tópicos em comum, pra explicar a sugestão ("porque você segue Moda")
}

export type Session = typeof sessions.$inferSelect
export type EmailTokenType = 'verify_email' | 'reset_password'
export type EmailToken = typeof emailTokens.$inferSelect

export type Profile = typeof profile.$inferSelect
export type ProfileInput = Partial<
  Omit<
    typeof profile.$inferInsert,
    | 'id'
    | 'userId'
    | 'createdAt'
    | 'displayNameChangeCount'
    | 'displayNameChangeWindowStart'
    | 'usernameChangeCount'
    | 'usernameChangeWindowStart'
    | 'isVerified'
  >
>

export type TextStyle = 'feminine' | 'masculine' | 'neutral'
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

export type CycleFlow = 'spotting' | 'light' | 'medium' | 'heavy'
export type CycleLog = typeof cycleLogs.$inferSelect
export type CycleLogInput = Omit<typeof cycleLogs.$inferInsert, 'id' | 'userId' | 'createdAt'>

export type IntimateType = 'solo' | 'partner' | 'toy'
export type IntimatePenetration = 'none' | 'vaginal' | 'anal'
export type IntimatePain = 'none' | 'light' | 'strong'
export type IntimateLog = typeof intimateLogs.$inferSelect
export type IntimateLogInput = Omit<typeof intimateLogs.$inferInsert, 'id' | 'userId' | 'createdAt'>

export type DayNote = typeof dayNotes.$inferSelect
export type DayNoteInput = Omit<typeof dayNotes.$inferInsert, 'id' | 'userId' | 'createdAt'>

export interface CyclePrediction {
  cycleDay: number | null // dia atual do ciclo (1 = primeiro dia do último período)
  nextPeriodStart: string | null // yyyy-MM-dd
  ovulationDate: string | null
  fertileWindowStart: string | null
  fertileWindowEnd: string | null
  averageCycleLength: number
}

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

export interface WorkoutExercise {
  name: string
  sets: number
  reps: string // texto livre: "12-15", "30s", "até falhar" etc.
  pinterestUrl?: string | null // link de referência (pin ou board) mostrado como embed
}
export type WorkoutProgram = typeof workoutPrograms.$inferSelect
export type WorkoutDay = typeof workoutDays.$inferSelect
export interface WorkoutDayInput {
  name: string
  daysOfWeek: number[]
  exercises: WorkoutExercise[]
}
export interface WorkoutProgramInput {
  name: string
  icon: string
  templateKey?: string | null
  active?: boolean
  days: WorkoutDayInput[]
}
export interface WorkoutProgramDetail extends WorkoutProgram {
  days: WorkoutDay[]
}
export interface WorkoutSetEntry {
  weight: number | null // kg; null = peso corporal/sem carga
  reps: number | null
  done: boolean
}
export interface WorkoutExerciseLog {
  name: string
  sets: WorkoutSetEntry[]
}
export type WorkoutLog = typeof workoutLogs.$inferSelect
export interface WorkoutSessionInput {
  workoutDayId: number
  date: string
  durationSeconds?: number | null
  notes?: string | null
  setLogs?: WorkoutExerciseLog[]
}

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

export type TitleTrack = 'sfw' | 'special'
export type UnlockedTitle = typeof unlockedTitles.$inferSelect
export type UnlockedTrophy = typeof unlockedTrophies.$inferSelect

export interface TrophyDef {
  key: string
  title: string
  description: string
  icon: string
}

export type Follow = typeof follows.$inferSelect
export type Block = typeof blocks.$inferSelect
export interface BlockedUserSummary {
  userId: number
  username: string
  displayName: string
  avatarUrl: string | null
  avatarIcon: string | null
}
export type PostLike = typeof postLikes.$inferSelect

export type PostComment = typeof postComments.$inferSelect
export type PostCommentInput = Omit<typeof postComments.$inferInsert, 'id' | 'userId' | 'createdAt'>
export type PostCommentLike = typeof postCommentLikes.$inferSelect
export interface PostCommentWithAuthor extends PostComment {
  author: {
    userId: number
    username: string
    displayName: string
    avatarUrl: string | null
    avatarIcon: string | null
    isVerified: boolean
  }
  likeCount: number
  likedByMe: boolean
  replies: PostCommentWithAuthor[]
}

export type DirectMessage = typeof directMessages.$inferSelect
export type DirectMessageInput = Omit<typeof directMessages.$inferInsert, 'id' | 'senderId' | 'readAt' | 'createdAt'>

export interface PublicUserSummary {
  userId: number
  username: string
  displayName: string
  avatarUrl: string | null
  avatarIcon: string | null
  pronouns: string
  isFollowedByMe: boolean
  isVerified: boolean
}

export interface ExternalLink {
  label: string
  url: string
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
  textStyle: string
  isPrivate: boolean
  followRequestPending: boolean
  followerCount: number
  followingCount: number
  avgMood: number | null
  avgLibido: number | null
  medications: SharedMedicationSummary[] | null
  hrtDurationDays: number | null
  posts: FeedPost[]
  titleSfw: string | null
  titleSpecial: string | null
  achievements: string[] | null
  trophies: string[] | null
  postsCollageStyle: string
  externalLinks: ExternalLink[]
}

export interface FeedPost extends Post {
  author: PublicUserSummary
  likeCount: number
  commentCount: number
  likedByMe: boolean
}

export type PostFontStyle = 'serif' | 'handwritten' | 'display'

export interface RepostOriginal {
  kind: 'post' | 'community'
  id: number
  author: PublicUserSummary
  text: string | null
  images: unknown
  communityName: string | null
  fontStyle: string | null
  cardStyle: boolean
  cardColor: string | null
  cardColor2: string | null
}

export interface FeedItem {
  kind: 'post' | 'community'
  id: number
  userId: number | null
  text: string | null
  images: unknown
  createdAt: Post['createdAt']
  author: PublicUserSummary
  likeCount: number
  commentCount: number
  likedByMe: boolean
  communityId: number | null
  communityName: string | null
  fontStyle: string | null
  cardStyle: boolean
  cardColor: string | null
  cardColor2: string | null
  repostOf: RepostOriginal | null
  repostCount: number
  repostedByMe: boolean
  myRepostId: number | null
}

export interface MySocialStats {
  followerCount: number
  postsCount: number
  commentsCount: number
  communityPostsCount: number
  communityCommentsCount: number
}

export interface DmThread {
  userId: number
  username: string
  displayName: string
  avatarUrl: string | null
  avatarIcon: string | null
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

export type Community = typeof communities.$inferSelect
export interface CommunityDetail extends Community {
  memberCount: number
  isMember: boolean
  isAdmin: boolean
}
export interface CommunitySummary extends Community {
  memberCount: number
  isMember: boolean
}
export type CommunityInput = Pick<typeof communities.$inferInsert, 'name' | 'description' | 'icon' | 'tags'>

export type CommunityMember = typeof communityMembers.$inferSelect
export interface CommunityMemberWithProfile {
  userId: number
  username: string
  displayName: string
  avatarUrl: string | null
  avatarIcon: string | null
  isVerified: boolean
  joinedAt: CommunityMember['joinedAt']
}

export type CommunityPost = typeof communityPosts.$inferSelect
export type CommunityPostInput = Omit<typeof communityPosts.$inferInsert, 'id' | 'userId' | 'communityId' | 'createdAt'>
export interface CommunityFeedPost extends CommunityPost {
  author: PublicUserSummary
  likeCount: number
  commentCount: number
  likedByMe: boolean
}

export type CommunityPostComment = typeof communityPostComments.$inferSelect
export type CommunityPostCommentLike = typeof communityPostCommentLikes.$inferSelect
export interface CommunityPostCommentWithAuthor extends CommunityPostComment {
  author: {
    userId: number
    username: string
    displayName: string
    avatarUrl: string | null
    avatarIcon: string | null
    isVerified: boolean
  }
  likeCount: number
  likedByMe: boolean
  replies: CommunityPostCommentWithAuthor[]
}
