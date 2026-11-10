// Comunidade em formato de fórum: tópicos com até 3 tags, respostas e curtidas. As tags são fixas
// (dá pra filtrar sem virar bagunça de grafia); "Avisos" e "Tutoriais do Aurora" são só da equipe.

export interface ForumTag {
  key: string
  label: string
  /** só admin pode usar */
  staff?: boolean
}

export const FORUM_TAGS: ForumTag[] = [
  { key: 'avisos', label: 'Avisos', staff: true },
  { key: 'tutoriais', label: 'Tutoriais do Aurora', staff: true },
  { key: 'hormonios', label: 'Hormônios' },
  { key: 'duvidas', label: 'Dúvidas' },
  { key: 'saude-mental', label: 'Saúde mental' },
  { key: 'desabafo', label: 'Desabafo' },
  { key: 'conquistas', label: 'Conquistas' },
  { key: 'corpo', label: 'Corpo e visual' },
  { key: 'treinos', label: 'Treinos' },
  { key: 'relacionamentos', label: 'Relacionamentos' },
  { key: 'familia', label: 'Família' },
  { key: 'trabalho', label: 'Trabalho e estudo' },
  { key: 'documentos', label: 'Documentos e retificação' },
  { key: 'indicacoes', label: 'Indicações (médicos, lugares)' },
  { key: 'off-topic', label: 'Papo livre' },
]

export const FORUM_TAG_BY_KEY = new Map(FORUM_TAGS.map((t) => [t.key, t]))
export const MAX_TOPIC_TAGS = 3
export const TOPIC_TITLE_MAX = 120
export const TOPIC_BODY_MAX = 5000
export const REPLY_MAX = 2000

export function validateTopicTags(tags: unknown, isAdmin: boolean): string | null {
  if (!Array.isArray(tags) || tags.length === 0) return 'escolha pelo menos uma tag'
  if (tags.length > MAX_TOPIC_TAGS) return `no máximo ${MAX_TOPIC_TAGS} tags`
  for (const t of tags) {
    const tag = typeof t === 'string' ? FORUM_TAG_BY_KEY.get(t) : undefined
    if (!tag) return 'tag inválida'
    if (tag.staff && !isAdmin) return `a tag "${tag.label}" é só da equipe`
  }
  if (new Set(tags).size !== tags.length) return 'tag repetida'
  return null
}

export interface ForumAuthor {
  id: number
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  avatarIcon: string | null
  frame: string | null
  isVerified: boolean
  isAdmin: boolean
}

export interface ForumTopicSummary {
  id: number
  title: string
  excerpt: string
  tags: string[]
  pinned: boolean
  locked: boolean
  replyCount: number
  likeCount: number
  likedByMe: boolean
  lastActivityAt: string
  createdAt: string
  author: ForumAuthor | null
}

export interface ForumReplyView {
  id: number
  body: string
  createdAt: string
  author: ForumAuthor | null
}

export interface ForumTopicDetail extends ForumTopicSummary {
  body: string
  editedAt: string | null
  replies: ForumReplyView[]
}
