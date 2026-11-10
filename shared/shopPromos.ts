import { SHOP_ITEMS, SHOP_ITEM_BY_KEY, itemTags, type ShopKind, type ShopTag } from './shopCatalog'

// Poções à venda e promoções da lojinha. O servidor calcula o preço final na compra (o app só mostra);
// as ofertas aleatórias do dia saem de uma semente com a data, então são iguais pra todo mundo.

export interface PotionOffer {
  key: string
  name: string
  description: string
  qty: number
  price: number
}

/** Poção do tempo comprada: cara de propósito — o jeito "normal" de ganhar é em baú. */
export const POTION_OFFERS: PotionOffer[] = [
  { key: 'potion-1', name: 'Poção do tempo', description: 'Salva um dia que você esqueceu de marcar', qty: 1, price: 150 },
  { key: 'potion-3', name: 'Frasco triplo', description: 'Três poções do tempo, mais em conta', qty: 3, price: 400 },
]
export const POTION_OFFER_BY_KEY = new Map(POTION_OFFERS.map((p) => [p.key, p]))

export type PromoScope = 'all' | 'kind' | 'item' | 'tag' | 'potions' | 'random'

export interface Promotion {
  id: number
  title: string
  percent: number
  scope: PromoScope
  /** kind / key do item / tag; no 'random', quantos itens por dia */
  target: string | null
  startsAt: string | null
  endsAt: string | null
  active: boolean
}

export interface PromoApplied {
  percent: number
  label: string
  endsAt: string | null
}

/** Se não tiver linha 'random' no banco, as ofertas do dia ficam ligadas com isso. */
export const DEFAULT_RANDOM_PROMO = { percent: 10, count: 3 }

export function discounted(price: number, percent: number): number {
  if (percent <= 0) return price
  return Math.max(1, Math.round((price * (100 - percent)) / 100))
}

/** Itens que podem cair na oferta do dia: tudo que é pago (pacotes e poções inclusos). */
function randomPool(): string[] {
  return [...SHOP_ITEMS.filter((i) => i.price > 0).map((i) => i.key), ...POTION_OFFERS.map((p) => p.key)]
}

// gerador simples com semente (mulberry32) — mesma data, mesmo sorteio
function seeded(seedStr: string) {
  let seed = 0
  for (const ch of seedStr) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) | 0
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomDailyKeys(dateStr: string, count: number): string[] {
  const pool = randomPool()
  const rand = seeded(`aurora-oferta-${dateStr}`)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.max(0, Math.min(count, 12)))
}

function covers(p: Promotion, key: string): boolean {
  const item = SHOP_ITEM_BY_KEY.get(key)
  const isPotion = POTION_OFFER_BY_KEY.has(key)
  switch (p.scope) {
    case 'all':
      return true
    case 'potions':
      return isPotion
    case 'kind':
      return !!item && item.kind === (p.target as ShopKind)
    case 'item':
      return p.target === key
    case 'tag':
      return !!item && itemTags(item).includes(p.target as ShopTag)
    default:
      return false
  }
}

function isLive(p: Promotion, now: Date): boolean {
  if (!p.active) return false
  if (p.startsAt && new Date(p.startsAt) > now) return false
  if (p.endsAt && new Date(p.endsAt) <= now) return false
  return true
}

/** Fim do dia de hoje no horário de Brasília (as ofertas aleatórias trocam à meia-noite). */
function endOfDaySaoPaulo(dateStr: string): string {
  return new Date(`${dateStr}T23:59:59-03:00`).toISOString()
}

/** Melhor desconto de cada item (não acumula: vale o maior). */
export function promoMap(promos: Promotion[], now = new Date()): Record<string, PromoApplied> {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now)
  const out: Record<string, PromoApplied> = {}
  const offer = (key: string, applied: PromoApplied) => {
    if (!out[key] || out[key].percent < applied.percent) out[key] = applied
  }
  const keys = [...SHOP_ITEMS.filter((i) => i.price > 0).map((i) => i.key), ...POTION_OFFERS.map((p) => p.key)]
  for (const p of promos) {
    if (p.scope === 'random' || !isLive(p, now)) continue
    for (const k of keys) if (covers(p, k)) offer(k, { percent: p.percent, label: p.title, endsAt: p.endsAt })
  }
  const randomRow = promos.find((p) => p.scope === 'random')
  const random = randomRow
    ? randomRow.active
      ? { percent: randomRow.percent, count: Number(randomRow.target) || DEFAULT_RANDOM_PROMO.count }
      : null
    : DEFAULT_RANDOM_PROMO
  if (random) {
    for (const k of randomDailyKeys(today, random.count)) offer(k, { percent: random.percent, label: 'Oferta do dia', endsAt: endOfDaySaoPaulo(today) })
  }
  return out
}
