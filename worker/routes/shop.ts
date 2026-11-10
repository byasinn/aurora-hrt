import { Hono } from 'hono'
import { and, desc, eq, gte, sum } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { potionPurchases, profile, shopPromotions, shopPurchases } from '../../shared/schema'
import { jsonResponse, requireAdmin, requireUser } from '../shared/auth'
import { loadPointsContext } from '../shared/pointsStats'
import {
  SHOP_ITEM_BY_KEY,
  SHOP_KINDS,
  SHOP_TAGS,
  bundlePriceFor,
  ownsItem,
  type EquippableKind,
  type ShopEquipped,
  type ShopState,
} from '../../shared/shopCatalog'
import { POTION_OFFER_BY_KEY, discounted, promoMap, type PromoScope, type Promotion } from '../../shared/shopPromos'
import type { Env } from '../env'

type Db = ReturnType<typeof getDb>

const EQUIP_COLUMN = {
  avatarFrame: 'equippedAvatarFrame',
  postFrame: 'equippedPostFrame',
  theme: 'equippedTheme',
  calendarSkin: 'equippedCalendar',
} as const satisfies Record<EquippableKind, string>

function toPromotion(r: typeof shopPromotions.$inferSelect): Promotion {
  return {
    id: r.id,
    title: r.title,
    percent: r.percent,
    scope: r.scope as PromoScope,
    target: r.target,
    startsAt: r.startsAt?.toISOString() ?? null,
    endsAt: r.endsAt?.toISOString() ?? null,
    active: r.active,
  }
}

async function loadState(db: Db, userId: number): Promise<ShopState> {
  const [ctx, [purchases, [spentRow], [potionSpentRow], [prof], promoRows]] = await Promise.all([
    loadPointsContext(db, userId),
    db.batch([
      db.select({ itemKey: shopPurchases.itemKey }).from(shopPurchases).where(eq(shopPurchases.userId, userId)),
      db.select({ value: sum(shopPurchases.price) }).from(shopPurchases).where(eq(shopPurchases.userId, userId)),
      db.select({ value: sum(potionPurchases.price) }).from(potionPurchases).where(eq(potionPurchases.userId, userId)),
      db
        .select({
          avatarFrame: profile.equippedAvatarFrame,
          postFrame: profile.equippedPostFrame,
          theme: profile.equippedTheme,
          calendarSkin: profile.equippedCalendar,
        })
        .from(profile)
        .where(eq(profile.userId, userId))
        .limit(1),
      db.select().from(shopPromotions),
    ]),
  ])
  const promos = promoRows.map(toPromotion)
  const spent = Number(spentRow?.value ?? 0) + Number(potionSpentRow?.value ?? 0)
  const equipped: ShopEquipped = prof ?? { avatarFrame: null, postFrame: null, theme: null, calendarSkin: null }
  const earned = ctx.stats.brilho
  return {
    earned,
    spent,
    // o Brilho pode cair depois de uma compra (ex.: limpeza do histórico retroativo) — saldo não fica negativo
    balance: Math.max(0, earned - spent),
    owned: purchases.map((p) => p.itemKey),
    equipped,
    promos: promoMap(promos),
    potions: ctx.points.potions,
  }
}

/** Card de post escolhido ao postar: precisa existir e ser da pessoa (ou grátis). */
export async function validateCardSkin(db: Db, userId: number, key: unknown): Promise<string | null> {
  if (key == null) return null
  if (typeof key !== 'string') return 'card inválido'
  const item = SHOP_ITEM_BY_KEY.get(key)
  if (!item || item.kind !== 'cardSkin') return 'card inválido'
  if (item.price === 0) return null
  const purchases = await db
    .select({ itemKey: shopPurchases.itemKey })
    .from(shopPurchases)
    .where(and(eq(shopPurchases.userId, userId), eq(shopPurchases.itemKey, key)))
    .limit(1)
  return ownsItem(purchases.map((p) => p.itemKey), key) ? null : 'compre esse card na lojinha antes de usar'
}

const app = new Hono<{ Bindings: Env }>()

app.get('/api/shop', async (c) => {
  const db = getDb(c.env)
  const auth = await requireUser(c.req.raw, db)
  if (auth instanceof Response) return auth
  try {
    return jsonResponse(await loadState(db, auth.user.id))
  } catch (err) {
    console.error('shop get error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

app.post('/api/shop/buy', async (c) => {
  const db = getDb(c.env)
  const auth = await requireUser(c.req.raw, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    const { itemKey } = (await c.req.json()) as { itemKey?: string }
    const item = itemKey ? SHOP_ITEM_BY_KEY.get(itemKey) : undefined
    if (!item) return jsonResponse({ error: 'item não existe' }, { status: 404 })
    if (item.price === 0) return jsonResponse({ error: 'esse item é grátis, não precisa comprar' }, { status: 400 })

    const state = await loadState(db, user.id)
    const owned = new Set(state.owned)
    if (ownsItem(owned, item.key)) return jsonResponse({ error: 'você já tem esse item' }, { status: 409 })
    // pacote: cobra só a parte que a pessoa ainda não tem; os itens entram com preço 0 (o gasto fica
    // todo na linha do pacote, então a soma de price continua sendo o total gasto). Promoção vale em cima.
    const base = item.kind === 'bundle' ? bundlePriceFor(item, owned) : item.price
    const price = discounted(base, state.promos[item.key]?.percent ?? 0)
    if (state.balance < price) {
      return jsonResponse({ error: `Falta ${price - state.balance} de Brilho pra esse item.` }, { status: 400 })
    }
    const rows = [
      { userId: user.id, itemKey: item.key, price },
      ...(item.items ?? []).filter((k) => !ownsItem(owned, k)).map((k) => ({ userId: user.id, itemKey: k, price: 0 })),
    ]

    // um INSERT só (atômico); o índice único (user, item) segura o clique duplo. Dois itens diferentes
    // ao mesmo tempo podem passar juntos da conta de saldo — aceitável pra moeda de enfeite, e o
    // saldo exibido nunca fica negativo
    const inserted = await db.insert(shopPurchases).values(rows).onConflictDoNothing().returning({ itemKey: shopPurchases.itemKey })
    if (!inserted.some((r) => r.itemKey === item.key)) return jsonResponse({ error: 'você já tem esse item' }, { status: 409 })

    return jsonResponse({ ...state, spent: state.spent + price, balance: Math.max(0, state.balance - price), owned: [...state.owned, ...inserted.map((r) => r.itemKey)] })
  } catch (err) {
    console.error('shop buy error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

// Poção do tempo: consumível, pode comprar de novo. Limite diário pra não sumir com o saldo num clique.
const POTION_BUYS_PER_DAY = 3

app.post('/api/shop/buy-potion', async (c) => {
  const db = getDb(c.env)
  const auth = await requireUser(c.req.raw, db)
  if (auth instanceof Response) return auth
  const { user } = auth
  try {
    const { offerKey } = (await c.req.json()) as { offerKey?: string }
    const offer = offerKey ? POTION_OFFER_BY_KEY.get(offerKey) : undefined
    if (!offer) return jsonResponse({ error: 'poção não existe' }, { status: 404 })
    const dayAgo = new Date(Date.now() - 86_400_000)
    const recent = await db
      .select({ id: potionPurchases.id })
      .from(potionPurchases)
      .where(and(eq(potionPurchases.userId, user.id), gte(potionPurchases.createdAt, dayAgo)))
    if (recent.length >= POTION_BUYS_PER_DAY) return jsonResponse({ error: 'chega de poção por hoje — volta amanhã!' }, { status: 429 })

    const state = await loadState(db, user.id)
    const price = discounted(offer.price, state.promos[offer.key]?.percent ?? 0)
    if (state.balance < price) return jsonResponse({ error: `Falta ${price - state.balance} de Brilho pra essa poção.` }, { status: 400 })
    await db.insert(potionPurchases).values({ userId: user.id, offerKey: offer.key, qty: offer.qty, price })
    // devolve o estado ajustado em vez de recalcular tudo (pontos não mudam com a compra)
    return jsonResponse({ ...state, spent: state.spent + price, balance: Math.max(0, state.balance - price), potions: state.potions + offer.qty })
  } catch (err) {
    console.error('shop potion error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

// Equipa (ou tira, com itemKey null) um item de um tipo. Cards de post não equipam — vão no próprio post.
app.post('/api/shop/equip', async (c) => {
  const db = getDb(c.env)
  const auth = await requireUser(c.req.raw, db)
  if (auth instanceof Response) return auth
  const { user } = auth

  try {
    const { kind, itemKey } = (await c.req.json()) as { kind?: string; itemKey?: string | null }
    if (!kind || !(kind in EQUIP_COLUMN)) return jsonResponse({ error: 'tipo inválido' }, { status: 400 })
    const column = EQUIP_COLUMN[kind as EquippableKind]

    if (itemKey != null) {
      const item = SHOP_ITEM_BY_KEY.get(itemKey)
      if (!item || item.kind !== kind) return jsonResponse({ error: 'item não existe' }, { status: 404 })
      if (item.price > 0) {
        const [owned] = await db
          .select({ id: shopPurchases.id })
          .from(shopPurchases)
          .where(and(eq(shopPurchases.userId, user.id), eq(shopPurchases.itemKey, itemKey)))
          .limit(1)
        if (!owned) return jsonResponse({ error: 'compre o item antes de usar' }, { status: 403 })
      }
    }

    await db
      .update(profile)
      .set({ [column]: itemKey ?? null })
      .where(eq(profile.userId, user.id))
    return jsonResponse(await loadState(db, user.id))
  } catch (err) {
    console.error('shop equip error', err)
    return jsonResponse({ error: 'internal error' }, { status: 500 })
  }
})

// ---------- admin: promoções ----------

interface PromoInput {
  title?: string
  percent?: number
  scope?: PromoScope
  target?: string | null
  startsAt?: string | null
  endsAt?: string | null
  active?: boolean
}

function validatePromo(b: PromoInput): string | null {
  if (!b.title?.trim() || b.title.length > 60) return 'título de 1 a 60 letras'
  if (!Number.isInteger(b.percent) || (b.percent ?? 0) < 1 || (b.percent ?? 0) > 90) return 'desconto entre 1% e 90%'
  if (!['all', 'kind', 'item', 'tag', 'potions', 'random'].includes(b.scope ?? '')) return 'onde vale a promoção?'
  if (b.scope === 'kind' && !SHOP_KINDS.includes(b.target as never)) return 'escolha o departamento'
  if (b.scope === 'item' && !SHOP_ITEM_BY_KEY.has(b.target ?? '') && !POTION_OFFER_BY_KEY.has(b.target ?? '')) return 'escolha o item'
  if (b.scope === 'tag' && !SHOP_TAGS.some((t) => t.key === b.target)) return 'escolha a categoria'
  if (b.scope === 'random' && !(Number(b.target) >= 1 && Number(b.target) <= 12)) return 'de 1 a 12 itens por dia'
  for (const d of [b.startsAt, b.endsAt]) if (d && Number.isNaN(new Date(d).getTime())) return 'data inválida'
  if (b.startsAt && b.endsAt && new Date(b.endsAt) <= new Date(b.startsAt)) return 'o fim precisa ser depois do começo'
  return null
}

function promoValues(b: PromoInput) {
  return {
    title: b.title!.trim(),
    percent: b.percent!,
    scope: b.scope!,
    target: b.scope === 'all' || b.scope === 'potions' ? null : (b.target ?? null),
    startsAt: b.startsAt ? new Date(b.startsAt) : null,
    endsAt: b.endsAt ? new Date(b.endsAt) : null,
    active: b.active !== false,
  }
}

app.get('/api/admin/promotions', async (c) => {
  const db = getDb(c.env)
  const a = await requireAdmin(c.req.raw, db)
  if (a instanceof Response) return a
  const rows = await db.select().from(shopPromotions).orderBy(desc(shopPromotions.createdAt))
  const promos = rows.map(toPromotion)
  return jsonResponse({ promotions: promos, today: promoMap(promos) })
})

app.post('/api/admin/promotions', async (c) => {
  const db = getDb(c.env)
  const a = await requireAdmin(c.req.raw, db)
  if (a instanceof Response) return a
  const body = (await c.req.json()) as PromoInput
  const error = validatePromo(body)
  if (error) return jsonResponse({ error }, { status: 400 })
  // só uma configuração de ofertas aleatórias: se já tem, atualiza
  if (body.scope === 'random') {
    const [existing] = await db.select().from(shopPromotions).where(eq(shopPromotions.scope, 'random')).limit(1)
    if (existing) {
      const [row] = await db.update(shopPromotions).set(promoValues(body)).where(eq(shopPromotions.id, existing.id)).returning()
      return jsonResponse(toPromotion(row))
    }
  }
  const [row] = await db.insert(shopPromotions).values(promoValues(body)).returning()
  return jsonResponse(toPromotion(row), { status: 201 })
})

app.put('/api/admin/promotions/:id', async (c) => {
  const db = getDb(c.env)
  const a = await requireAdmin(c.req.raw, db)
  if (a instanceof Response) return a
  const body = (await c.req.json()) as PromoInput
  const error = validatePromo(body)
  if (error) return jsonResponse({ error }, { status: 400 })
  const [row] = await db
    .update(shopPromotions)
    .set(promoValues(body))
    .where(eq(shopPromotions.id, Number(c.req.param('id'))))
    .returning()
  return row ? jsonResponse(toPromotion(row)) : jsonResponse({ error: 'promoção não encontrada' }, { status: 404 })
})

app.delete('/api/admin/promotions/:id', async (c) => {
  const db = getDb(c.env)
  const a = await requireAdmin(c.req.raw, db)
  if (a instanceof Response) return a
  await db.delete(shopPromotions).where(eq(shopPromotions.id, Number(c.req.param('id'))))
  return jsonResponse({ ok: true })
})

export default app
