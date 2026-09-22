// Parser de RSS/Atom feito à mão — Workers não tem DOMParser (é uma API só de navegador), e trazer
// uma lib XML completa só pra isso era peso desnecessário. RSS/Atom têm estrutura simples o
// suficiente pra extrair com regex de forma confiável na prática (é a mesma técnica que serviços
// tipo "rss-to-json" usam por baixo).

export interface FetchedFeedItem {
  title: string
  url: string
  thumbnailUrl: string | null
  summary: string | null
  publishedAt: Date | null
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim()
}

function extractTag(block: string, tag: string): string | null {
  // cobre <tag>texto</tag> e <tag><![CDATA[texto]]></tag>
  const m = block.match(new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))\\s*</${tag}>`, 'i'))
  if (!m) return null
  const raw = (m[1] ?? m[2] ?? '').trim()
  return raw ? decodeEntities(raw.replace(/<[^>]+>/g, '')) : null
}

function extractAttr(block: string, tag: string, attr: string): string | null {
  const m = block.match(new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["']`, 'i'))
  return m ? decodeEntities(m[1]) : null
}

function extractThumbnail(block: string): string | null {
  return (
    extractAttr(block, 'media:thumbnail', 'url') ??
    extractAttr(block, 'media:content', 'url') ??
    extractAttr(block, 'enclosure', 'url') ??
    // primeira <img src="..."> dentro da descrição, quando a fonte não manda thumbnail separado
    (block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null)
  )
}

function parseRssItem(block: string): FetchedFeedItem | null {
  const title = extractTag(block, 'title')
  const url = extractTag(block, 'link') ?? extractAttr(block, 'link', 'href')
  if (!title || !url) return null
  const dateStr = extractTag(block, 'pubDate') ?? extractTag(block, 'dc:date')
  const publishedAt = dateStr ? new Date(dateStr) : null
  return {
    title,
    url,
    thumbnailUrl: extractThumbnail(block),
    summary: extractTag(block, 'description'),
    publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
  }
}

function parseAtomEntry(block: string): FetchedFeedItem | null {
  const title = extractTag(block, 'title')
  // Atom pode ter vários <link>, prioriza rel="alternate" ou o primeiro href
  const url =
    block.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i)?.[1] ??
    extractAttr(block, 'link', 'href')
  if (!title || !url) return null
  const dateStr = extractTag(block, 'published') ?? extractTag(block, 'updated')
  const publishedAt = dateStr ? new Date(dateStr) : null
  return {
    title,
    url: decodeEntities(url),
    thumbnailUrl: extractThumbnail(block),
    summary: extractTag(block, 'summary') ?? extractTag(block, 'content'),
    publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
  }
}

const MAX_ITEMS_PER_FETCH = 15

/** Busca e faz parse de um feed RSS ou Atom. Lança erro se a busca falhar ou o feed vier vazio —
 * quem chama decide como registrar isso (worker/scheduled.ts grava em contentSources.lastError). */
export async function fetchFeed(feedUrl: string): Promise<FetchedFeedItem[]> {
  const res = await fetch(feedUrl, {
    headers: { 'user-agent': 'AuroraBot/1.0 (+https://aurorahrt.com.br)' },
    cf: { cacheTtl: 600, cacheEverything: true },
  })
  if (!res.ok) throw new Error(`feed respondeu ${res.status}`)
  const xml = await res.text()

  const rssItems = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((m) => m[1])
  const atomEntries = [...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)].map((m) => m[1])

  const parsed =
    rssItems.length > 0
      ? rssItems.map(parseRssItem)
      : atomEntries.map(parseAtomEntry)

  return parsed.filter((i): i is FetchedFeedItem => i != null).slice(0, MAX_ITEMS_PER_FETCH)
}
