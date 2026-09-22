// Data URLs (base64) mandadas direto pela API, sem passar pelo redimensionamento do cliente
// (src/lib/image.ts) — alguém batendo na API na mão poderia mandar qualquer tamanho.
const MAX_IMAGE_DATA_URL_CHARS = 4_000_000 // ~3MB de imagem decodificada
const MAX_IMAGES_PER_POST = 6
const MAX_TEXT_CHARS = 5_000

export function validateImages(images: unknown): string | null {
  if (images === undefined || images === null) return null
  if (!Array.isArray(images)) return 'images inválido'
  if (images.length > MAX_IMAGES_PER_POST) return `máximo de ${MAX_IMAGES_PER_POST} imagens por post`
  for (const img of images) {
    if (typeof img !== 'string' || img.length > MAX_IMAGE_DATA_URL_CHARS) return 'imagem muito grande'
  }
  return null
}

export function validateSingleImage(value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string' || value.length > MAX_IMAGE_DATA_URL_CHARS) return 'imagem muito grande'
  return null
}

export function validateText(value: unknown, maxChars = MAX_TEXT_CHARS): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') return 'texto inválido'
  if (value.length > maxChars) return 'texto muito longo'
  return null
}

const ALLOWED_FONT_STYLES = new Set(['serif', 'handwritten', 'display'])

export function validateFontStyle(value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string' || !ALLOWED_FONT_STYLES.has(value)) return 'estilo de fonte inválido'
  return null
}

export function validateHexColor(value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string' || !/^#[0-9a-fA-F]{3,8}$/.test(value)) return 'cor inválida'
  return null
}

/** Data 'YYYY-MM-DD' bem formada e dentro de uma janela sã (sem datas absurdamente no passado/futuro). */
export function validateDateStr(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date inválida'
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return 'date inválida'
  const now = Date.now()
  if (d.getTime() > now + 24 * 60 * 60 * 1000) return 'date não pode ser no futuro'
  if (d.getTime() < now - 100 * 365 * 24 * 60 * 60 * 1000) return 'date inválida'
  return null
}

/** value precisa ser null/undefined ou uma das opções permitidas. */
export function validateEnum(value: unknown, allowed: readonly string[], field: string): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string' || !allowed.includes(value)) return `${field} inválido`
  return null
}

/** Array de strings curtas — usado pra sintomas/tipos, campos que não passam por validateText. */
export function validateStringArray(value: unknown, field: string, maxItems = 20, maxItemChars = 60): string | null {
  if (value === undefined || value === null) return null
  if (!Array.isArray(value)) return `${field} inválido`
  if (value.length > maxItems) return `máximo de ${maxItems} itens em ${field}`
  for (const item of value) {
    if (typeof item !== 'string' || item.length > maxItemChars) return `item inválido em ${field}`
  }
  return null
}

/** Tira campos que nunca podem vir do cliente num UPDATE (.set(body)) — sem isso, um PUT que só
 * confere dono no WHERE ainda deixa o corpo da requisição sobrescrever userId/id/createdAt no SET,
 * o que pode reatribuir a linha (que ainda é sua no momento da query) pra outra conta. Usa isso em
 * todo `.update(table).set(...)` que recebe o corpo da requisição direto. */
export function stripOwnerFields<T extends Record<string, unknown>>(body: T): Omit<T, 'id' | 'userId' | 'createdAt'> {
  const { id: _id, userId: _userId, createdAt: _createdAt, ...rest } = body as Record<string, unknown>
  return rest as Omit<T, 'id' | 'userId' | 'createdAt'>
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

/** Array de horários 'HH:MM' — usado pros horários de dose de um medicamento (uma ou mais por dia). */
export function validateTimeArray(value: unknown, field: string, maxItems = 6): string | null {
  if (!Array.isArray(value) || value.length === 0) return `${field} precisa ter pelo menos um horário`
  if (value.length > maxItems) return `máximo de ${maxItems} horários em ${field}`
  for (const item of value) {
    if (typeof item !== 'string' || !TIME_RE.test(item)) return `horário inválido em ${field}`
  }
  return null
}

/** Número (com casas decimais) finito dentro de [min, max] — usado pra valor de medida/exame, que
 * não pode ser Infinity/NaN nem um número absurdo. */
export function validateFloatRange(value: unknown, min: number, max: number, field: string): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    return `${field} precisa ser um número entre ${min} e ${max}`
  }
  return null
}

/** Inteiro dentro de [min, max] — usado pra durações de ciclo/período, que não podem ser 0/negativas. */
export function validateIntRange(value: unknown, min: number, max: number, field: string): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    return `${field} precisa ser um número entre ${min} e ${max}`
  }
  return null
}

/** Array de ids numéricos (ex: tag ids de humor/sintoma) — só valida forma, não se os ids existem. */
export function validateIntArray(value: unknown, field: string, maxItems = 50): string | null {
  if (value === undefined || value === null) return null
  if (!Array.isArray(value)) return `${field} inválido`
  if (value.length > maxItems) return `máximo de ${maxItems} itens em ${field}`
  for (const item of value) {
    if (typeof item !== 'number' || !Number.isInteger(item)) return `item inválido em ${field}`
  }
  return null
}

/** Array onde cada item precisa estar num conjunto fechado de opções (ex: tipos de atividade). */
export function validateEnumArray(value: unknown, allowed: readonly string[], field: string, maxItems = 10): string | null {
  if (value === undefined || value === null) return null
  if (!Array.isArray(value)) return `${field} inválido`
  if (value.length > maxItems) return `máximo de ${maxItems} itens em ${field}`
  for (const item of value) {
    if (typeof item !== 'string' || !allowed.includes(item)) return `item inválido em ${field}`
  }
  return null
}

const MAX_EXTERNAL_LINKS = 5

export function validateExternalLinks(value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (!Array.isArray(value)) return 'links inválidos'
  if (value.length > MAX_EXTERNAL_LINKS) return `máximo de ${MAX_EXTERNAL_LINKS} links`
  for (const item of value) {
    if (typeof item !== 'object' || item === null) return 'link inválido'
    const { label, url } = item as { label?: unknown; url?: unknown }
    if (typeof label !== 'string' || !label.trim() || label.length > 40) return 'label do link inválido'
    if (typeof url !== 'string' || url.length > 300) return 'url do link inválida'
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return 'url do link precisa ser http(s)'
    } catch {
      return 'url do link inválida'
    }
  }
  return null
}
