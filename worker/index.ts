import { Hono } from 'hono'
import type { Env } from './env'
import { runScheduledReminders } from './scheduled'
import { runFeedIngestion } from './shared/topicIngestion'
import { getDb } from './shared/db'
import { jsonResponse } from './shared/auth'
import { isRateLimited, isRateLimitedInMemory, clientIp } from './shared/rateLimit'

import achievements from './routes/achievements'
import adminBootstrap from './routes/admin-bootstrap'
import adminUsers from './routes/admin-users'
import announcements from './routes/announcements'
import adminMigrateImages from './routes/admin-migrate-images'
import adminWipeImages from './routes/admin-wipe-images'
import adminModerationLog from './routes/admin-moderation-log'
import topicPages from './routes/topic-pages'
import topicPosts from './routes/topic-posts'
import contentSources from './routes/content-sources'
import topicPageFollows from './routes/topic-page-follows'
import followSuggestions from './routes/follow-suggestions'
import reports from './routes/reports'
import authDeleteAccount from './routes/auth-delete-account'
import authGoogleCallback from './routes/auth-google-callback'
import authGoogleStart from './routes/auth-google-start'
import authLogin from './routes/auth-login'
import authLogout from './routes/auth-logout'
import authMe from './routes/auth-me'
import authRequestReset from './routes/auth-request-reset'
import authResendVerification from './routes/auth-resend-verification'
import authResetPassword from './routes/auth-reset-password'
import authSignup from './routes/auth-signup'
import authVerifyEmail from './routes/auth-verify-email'
import communities from './routes/communities'
import cycleLogs from './routes/cycle-logs'
import intimateLogs from './routes/intimate-logs'
import dayNotes from './routes/day-notes'
import images from './routes/images'
import communityMembers from './routes/community-members'
import communityPostComments from './routes/community-post-comments'
import communityPostCommentLikes from './routes/community-post-comment-likes'
import communityPostLikes from './routes/community-post-likes'
import communityPosts from './routes/community-posts'
import dmMessages from './routes/dm-messages'
import blocks from './routes/blocks'
import dmThreads from './routes/dm-threads'
import doses from './routes/doses'
import exportData from './routes/export-data'
import feed from './routes/feed'
import follows from './routes/follows'
import followRequests from './routes/follow-requests'
import labs from './routes/labs'
import manifest from './routes/manifest'
import measurements from './routes/measurements'
import medications from './routes/medications'
import messages from './routes/messages'
import moods from './routes/moods'
import mySocialStats from './routes/my-social-stats'
import postComments from './routes/post-comments'
import postCommentLikes from './routes/post-comment-likes'
import postLikes from './routes/post-likes'
import posts from './routes/posts'
import profile from './routes/profile'
import pushSubscribe from './routes/push-subscribe'
import routineLogs from './routes/routine-logs'
import routines from './routes/routines'
import tags from './routes/tags'
import today from './routes/today'
import unlockedTitles from './routes/unlocked-titles'
import unlockedTrophies from './routes/unlocked-trophies'
import usersConnections from './routes/users-connections'
import usersProfile from './routes/users-profile'
import usersSearch from './routes/users-search'
import vapidPublicKey from './routes/vapid-public-key'
import workoutLogs from './routes/workout-logs'
import workoutPrograms from './routes/workout-programs'

const app = new Hono<{ Bindings: Env }>()

// script/frame/connect do Pinterest são reais — o composer de post deixa colar link do Pinterest e
// embeda via pinit.js (src/components/PinterestEmbed.tsx). Domínios levantados inspecionando o
// próprio pinit.js/pinit_main.js deles; se algum embed quebrar, é sinal de que falta algum aqui.
// ATENÇÃO: essa política só entra em respostas que ainda não têm CSP (linha com
// `res.headers.has('content-security-policy')` mais abaixo) — o carregamento de `/` (o HTML/PWA
// em si) é servido como asset estático e pega a política de public/_headers, não essa daqui.
// As duas precisam ficar iguais manualmente; mudou uma, muda a outra.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://assets.pinterest.com https://www.pinterest.com",
  // 'unsafe-inline' em style-src é necessário — o app usa style={{...}} do React pra cor de tema
  // dinâmica (accent/gradiente configurável pelo usuário) em vários componentes.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // https: solto (em vez de listar domínio por domínio) porque a notícia do dia vem de fontes RSS
  // cadastráveis por admin sem deploy (worker/routes/content-sources.ts) — qualquer domínio novo de
  // thumbnail ficaria bloqueado até alguém lembrar de atualizar essa lista. <img> não executa
  // conteúdo então isso não abre brecha de XSS como um https: solto em script-src abriria.
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://widgets.pinterest.com https://log.pinterest.com https://assets.pinterest.com https://www.pinterest.com",
  "frame-src https://widgets.pinterest.com https://www.pinterest.com https://assets.pinterest.com",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ')

// Cabeçalhos de segurança em TODA resposta do Worker (API + fallback de SPA). Respostas de asset
// estático "puro" (JS/CSS/imagens que batem em arquivo real do dist/) são servidas direto pela
// Cloudflare sem passar por aqui — essas pegam os mesmos cabeçalhos via public/_headers.
app.use('*', async (c, next) => {
  await next()
  // reconstrói a Response pra garantir headers mutáveis mesmo quando c.res vem de um fetch alheio
  // (ex: env.ASSETS.fetch no fallback de SPA), que em alguns runtimes vem com header guard imutável.
  const res = new Response(c.res.body, c.res)
  res.headers.set('x-content-type-options', 'nosniff')
  res.headers.set('x-frame-options', 'DENY')
  res.headers.set('referrer-policy', 'strict-origin-when-cross-origin')
  res.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()')
  res.headers.set('cross-origin-opener-policy', 'same-origin')
  res.headers.set('strict-transport-security', 'max-age=63072000; includeSubDomains; preload')
  if (!res.headers.has('content-security-policy')) res.headers.set('content-security-policy', CONTENT_SECURITY_POLICY)
  c.res = res
})

// Freio global contra explosão de tráfego (bot, scraper, cliente com bug em loop) — em cima dos
// limites específicos que já existem por endpoint (cadastro, posts, denúncias). GET usa o limitador
// em memória (alto volume, não vale gravar linha por request); escrita (POST/PUT/DELETE) usa o
// limitador do banco, mais caro mas confiável entre isolates — abuso de escrita é mais raro e mais
// grave, vale o custo.
const GLOBAL_GET_WINDOW_MS = 60_000
const GLOBAL_GET_MAX = 240 // ~4 req/s sustentado por IP — bem acima de uso normal (polling do react-query em várias abas)
const GLOBAL_WRITE_WINDOW_MS = 60_000
const GLOBAL_WRITE_MAX = 60 // ~1 escrita/s sustentada por IP — cobre curtir/seguir/comentar em sequência normal

app.use('/api/*', async (c, next) => {
  const ip = clientIp(c.req.raw)
  const method = c.req.method

  if (method === 'GET' || method === 'HEAD') {
    if (isRateLimitedInMemory(`get:${ip}`, GLOBAL_GET_WINDOW_MS, GLOBAL_GET_MAX)) {
      return jsonResponse({ error: 'Muitas requisições. Espere um pouco e tente de novo.' }, { status: 429 })
    }
  } else if (method !== 'OPTIONS') {
    const db = getDb(c.env)
    if (await isRateLimited(db, `write:${ip}`, GLOBAL_WRITE_WINDOW_MS, GLOBAL_WRITE_MAX)) {
      return jsonResponse({ error: 'Muitas requisições. Espere um pouco e tente de novo.' }, { status: 429 })
    }
  }

  await next()
})

const routes = [
  achievements,
  announcements,
  adminBootstrap,
  adminUsers,
  adminMigrateImages,
  adminWipeImages,
  adminModerationLog,
  topicPages,
  topicPosts,
  contentSources,
  topicPageFollows,
  followSuggestions,
  reports,
  authDeleteAccount,
  authGoogleCallback,
  authGoogleStart,
  authLogin,
  authLogout,
  authMe,
  authRequestReset,
  authResendVerification,
  authResetPassword,
  authSignup,
  authVerifyEmail,
  communities,
  communityMembers,
  cycleLogs,
  intimateLogs,
  dayNotes,
  images,
  communityPostComments,
  communityPostCommentLikes,
  communityPostLikes,
  communityPosts,
  blocks,
  dmMessages,
  dmThreads,
  doses,
  exportData,
  feed,
  follows,
  followRequests,
  labs,
  manifest,
  measurements,
  medications,
  messages,
  moods,
  mySocialStats,
  postComments,
  postCommentLikes,
  postLikes,
  posts,
  profile,
  pushSubscribe,
  routineLogs,
  routines,
  tags,
  today,
  unlockedTitles,
  unlockedTrophies,
  usersConnections,
  usersProfile,
  usersSearch,
  vapidPublicKey,
  workoutLogs,
  workoutPrograms,
]

for (const route of routes) {
  app.route('/', route)
}

// Qualquer coisa que não bateu numa rota /api/* é navegação do SPA — devolve pros assets estáticos
// (o binding ASSETS já respeita not_found_handling = "single-page-application" do wrangler.toml).
app.notFound((c) => c.env.ASSETS.fetch(c.req.raw))

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runScheduledReminders(env))
    ctx.waitUntil(runFeedIngestion(env))
  },
}
