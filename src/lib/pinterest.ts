export type PinterestEmbedType = 'pin' | 'board'

const PIN_ANCHORED = /^https?:\/\/(?:[a-z]{2}\.)?pinterest\.[a-z.]+\/pin\/[\w-]+\/?(?:\?.*)?$/i
const SHORT_ANCHORED = /^https?:\/\/pin\.it\/[\w-]+$/i
const BOARD_ANCHORED = /^https?:\/\/(?:[a-z]{2}\.)?pinterest\.[a-z.]+\/([\w.-]+)\/([\w.-]+)\/?(?:\?.*)?$/i
const RESERVED_FIRST_SEGMENT = new Set(['pin', 'search', 'explore', 'today', 'ideas', 'news'])

/** Decide se uma URL isolada é um Pin (foto/vídeo único) ou um Board (pasta com vários) do Pinterest. */
export function detectPinterestEmbed(url: string): PinterestEmbedType | null {
  const trimmed = url.trim()
  if (PIN_ANCHORED.test(trimmed) || SHORT_ANCHORED.test(trimmed)) return 'pin'
  const boardMatch = trimmed.match(BOARD_ANCHORED)
  if (boardMatch && !RESERVED_FIRST_SEGMENT.has(boardMatch[1].toLowerCase())) return 'board'
  return null
}

const SEARCH_REGEX = /https?:\/\/(?:[a-z]{2}\.)?pinterest\.[a-z.]+\/[^\s]+|https?:\/\/pin\.it\/[\w-]+/gi

/** Acha a primeira URL do Pinterest (pin ou board) embedável dentro de um texto livre. */
export function findPinterestUrl(text: string): string | null {
  const matches = text.match(SEARCH_REGEX)
  if (!matches) return null
  for (const raw of matches) {
    const cleaned = raw.replace(/[.,;!?)\]]+$/, '')
    if (detectPinterestEmbed(cleaned)) return cleaned
  }
  return null
}

/** Remove a URL do meio do texto (ela vira o embed visual, não precisa aparecer como link cru). */
export function stripUrlFromText(text: string, url: string): string {
  return text.replace(url, '').replace(/\s{2,}/g, ' ').trim()
}
