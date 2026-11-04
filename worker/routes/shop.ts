import { Hono } from 'hono'
import { and, eq, sum } from 'drizzle-orm'
import { getDb } from '../shared/db'
import { profile, shopPurchases } from '../../shared/schema'
import { jsonResponse, requireUser } from '../shared/auth'
import { computeServerPointsStats } from '../shared/pointsStats'
import {
  SHOP_ITEM_BY_KEY,
  bundlePriceFor,
  ownsItem,
  type EquippableKind,
  type ShopEquipped,
  type ShopState,
} from '../../shared/shopCatalog'
import type { Env } from '../env'

type Db = ReturnType<typeof getDb>

const EQUIP_COLUMN = {
  avatarFrame: 'equippedAvatarFrame',
  postFrame: 'equippedPostFrame',
  theme: 'equippedTheme',
  calendarSkin: 'equippedCalendar',
} as const satisfies Record<EquippableKind, string>

async function loadState(db: Db, userId: number): Promise<ShopState> {
  const [stats, purchases, [spentRow], [prof]] = await Promise.all([
    computeServerPointsStats(db, userId),
    db.select({ itemKey: shopPurchases.itemKey }).from(shopPurchases).where(eq(shopPurchases.userId, userId)),
    db.select({ value: sum(shopPurchases.price) }).from(shopPurchases).where(eq(shopPurchases.userId, userId)),
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
  ])
  const spent = Number(spentRow?.value ?? 0)
  const equipped: ShopEquipped = prof ?? { avatarFrame: null, postFrame: null, theme: null, calendarSkin: null }
  return {
    earned: stats.brilho,
    spent,
    // o Brilho pode cair depois de uma compra (ex.: limpeza do histórico retroativo) — saldo não fica negativo
    balance: Math.max(0, stats.brilho - spent),
    owned: purchases.map((p) => p.itemKey),
    equipped,
  }
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
    // todo na linha do pacote, então a soma de price continua sendo o total gasto)
    const price = item.kind === 'bundle' ? bundlePriceFor(item, owned) : item.price
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

    return jsonResponse(await loadState(db, user.id))
  } catch (err) {
    console.error('shop buy error', err)
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

/** Card da lojinha num post novo: precisa existir, ser do tipo card e a pessoa ter (ou ser grátis). */
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

export default app
