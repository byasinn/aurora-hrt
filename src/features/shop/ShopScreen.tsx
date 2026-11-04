import { useState } from 'react'
import { Check, Lock } from 'lucide-react'
import clsx from 'clsx'
import { Button, Card, ScreenTitle } from '../../components/ui'
import PixelIcon from '../../components/PixelIcon'
import { useShop, useBuyItem, useEquipItem } from '../../api/shop'
import { playSound } from '../../lib/sounds'
import { useThemeStore } from '../../lib/themeStore'
import { showToast, toastError } from '../../lib/toast'
import ItemPreview from './ItemPreview'
import {
  SHOP_ITEMS,
  SHOP_ITEM_BY_KEY,
  SHOP_KINDS,
  SHOP_KIND_LABEL,
  DEFAULT_THEME,
  bundleFullPrice,
  bundlePriceFor,
  ownsItem,
  type EquippableKind,
  type ShopItem,
  type ShopKind,
  type ShopState,
} from '../../../shared/shopCatalog'

const TAB_KEY = 'transapp.shopTab'

// o que vem num pacote, no singular — os nomes dos itens se repetem ("Trans · Trans · Trans")
const BUNDLE_PART_LABEL: Record<ShopKind, string> = {
  bundle: 'Pacote',
  cardSkin: 'Card',
  avatarFrame: 'Moldura',
  postFrame: 'Borda',
  theme: 'Tema',
  calendarSkin: 'Calendário',
}

function readTab(): ShopKind {
  try {
    const saved = localStorage.getItem(TAB_KEY) as ShopKind | null
    if (saved && SHOP_KINDS.includes(saved)) return saved
  } catch {
    // sem storage (aba anônima) — começa na primeira
  }
  return SHOP_KINDS[0]
}

function PriceLabel({ price, full }: { price: number; full?: number }) {
  return (
    <>
      <PixelIcon name="coin" size={14} />
      <span className="font-pixel text-[15px]">{price}</span>
      {full != null && full > price && <span className="font-pixel text-xs line-through opacity-60">{full}</span>}
    </>
  )
}

function ItemCard({ item, shop }: { item: ShopItem; shop: ShopState }) {
  const buy = useBuyItem()
  const equip = useEquipItem()
  const owned = ownsItem(shop.owned, item.key)
  const isBundle = item.kind === 'bundle'
  const equippable = item.kind !== 'cardSkin' && !isBundle
  const mode = useThemeStore((t) => t.mode)
  // sem tema escolhido, o app está no tema base do modo atual (src/App.tsx)
  const equippedKey = item.kind === 'theme' ? (shop.equipped.theme ?? DEFAULT_THEME[mode]) : shop.equipped[item.kind as EquippableKind]
  const isEquipped = equippable && equippedKey === item.key
  const price = isBundle ? bundlePriceFor(item, shop.owned) : item.price
  const missing = price - shop.balance

  async function handleBuy() {
    try {
      await buy.mutateAsync(item.key)
      playSound('coin')
      showToast(isBundle ? `${item.name} é seu! Os itens já estão em cada aba ✨` : `${item.name} é seu! ✨`, 'info')
    } catch (err) {
      playSound('error')
      toastError(err, 'Não deu pra comprar agora. Tenta de novo.')
    }
  }

  async function handleEquip() {
    // tema não "desequipa" — sempre tem um; nos outros, tocar de novo tira
    const itemKey = isEquipped ? null : item.key
    try {
      await equip.mutateAsync({ kind: item.kind as EquippableKind, itemKey })
      playSound(itemKey ? 'success' : 'toggle')
    } catch (err) {
      toastError(err, 'Não deu pra usar esse item agora.')
    }
  }

  return (
    <Card
      className={clsx(
        'flex flex-col gap-3 p-3',
        isBundle && 'col-span-2 lg:col-span-3',
        isEquipped && 'border-2 border-[var(--accent)]',
      )}
    >
      <div className={clsx('relative', isBundle ? 'h-28' : 'h-24')}>
        <ItemPreview item={item} />
        {item.pixel && (
          <span className="font-pixel absolute right-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] uppercase text-white">8-bit</span>
        )}
        {item.price === 0 && !isBundle && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">grátis</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold leading-tight text-[var(--text)]">{item.name}</p>
        <p className="text-xs text-[var(--text-muted)]">{item.description}</p>
        {isBundle && (
          <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">
            {(item.items ?? []).map((k) => BUNDLE_PART_LABEL[SHOP_ITEM_BY_KEY.get(k)?.kind ?? 'bundle']).join(' · ')}
          </p>
        )}
      </div>

      {!owned ? (
        <Button size="sm" onClick={handleBuy} disabled={missing > 0 || buy.isPending} className="w-full">
          {missing > 0 && <Lock size={14} />}
          <PriceLabel price={price} full={isBundle ? bundleFullPrice(item) : undefined} />
        </Button>
      ) : !equippable ? (
        <p className="flex min-h-9 items-center justify-center gap-1 rounded-2xl bg-[var(--accent-soft)] px-2 text-center text-sm font-bold text-[var(--text)]">
          <Check size={14} /> {isBundle ? 'Seu · use em cada aba' : 'Seu · escolha ao postar'}
        </p>
      ) : (
        <Button
          size="sm"
          variant={isEquipped ? 'secondary' : 'primary'}
          onClick={handleEquip}
          disabled={equip.isPending || (isEquipped && item.kind === 'theme')}
          className="w-full"
        >
          {isEquipped ? (
            <>
              <Check size={14} /> Usando
            </>
          ) : (
            'Usar'
          )}
        </Button>
      )}
      {!owned && missing > 0 && <p className="-mt-1.5 text-center text-xs text-[var(--text-muted)]">Faltam {missing}</p>}
    </Card>
  )
}

export default function ShopScreen() {
  const { data: shop, isLoading, isError } = useShop()
  const [tab, setTab] = useState<ShopKind>(readTab)

  function selectTab(kind: ShopKind) {
    playSound('tap')
    setTab(kind)
    try {
      localStorage.setItem(TAB_KEY, kind)
    } catch {
      // sem storage — só não lembra a aba
    }
  }

  return (
    <div className="space-y-4">
      <ScreenTitle subtitle="Troque seu Brilho por enfeites pro seu perfil, seus posts e seu app.">Lojinha</ScreenTitle>

      <Card className="flex items-center gap-4">
        <PixelIcon name="coin" size={44} />
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Seu saldo</p>
          <p className="font-pixel text-4xl font-bold leading-none text-[var(--text)]">{shop?.balance ?? '–'}</p>
        </div>
        {shop && (
          <div className="text-right text-xs text-[var(--text-muted)]">
            <p>
              Ganhou <span className="font-bold text-[var(--text)]">{shop.earned}</span>
            </p>
            <p>
              Gastou <span className="font-bold text-[var(--text)]">{shop.spent}</span>
            </p>
          </div>
        )}
      </Card>
      <p className="-mt-2 px-1 text-xs text-[var(--text-muted)]">
        Comprar não tira seus títulos: eles contam todo o Brilho que você já ganhou.
      </p>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {SHOP_KINDS.map((kind) => (
          <button
            key={kind}
            onClick={() => selectTab(kind)}
            className={clsx(
              'min-h-10 shrink-0 rounded-full border-2 px-4 text-sm font-bold transition',
              tab === kind
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
            )}
          >
            {SHOP_KIND_LABEL[kind]}
          </button>
        ))}
      </div>

      {isError && <p className="text-sm text-[var(--text-muted)]">Não deu pra abrir a lojinha agora. Tenta de novo daqui a pouco.</p>}
      {isLoading && <p className="text-sm text-[var(--text-muted)]">Abrindo a lojinha…</p>}
      {shop && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {SHOP_ITEMS.filter((i) => i.kind === tab).map((item) => (
            <ItemCard key={item.key} item={item} shop={shop} />
          ))}
        </div>
      )}
    </div>
  )
}
