import { Check, Lock } from 'lucide-react'
import clsx from 'clsx'
import { Button, Card } from '../../components/ui'
import PixelIcon from '../../components/PixelIcon'
import { useBuyItem, useEquipItem } from '../../api/shop'
import { playSound } from '../../lib/sounds'
import { useThemeStore } from '../../lib/themeStore'
import { showToast, toastError } from '../../lib/toast'
import ItemPreview from './ItemPreview'
import {
  SHOP_ITEM_BY_KEY,
  DEFAULT_THEME,
  bundleFullPrice,
  bundlePriceFor,
  ownsItem,
  type EquippableKind,
  type ShopItem,
  type ShopKind,
  type ShopState,
} from '../../../shared/shopCatalog'

// Cartão de um item da lojinha — usado na vitrine (Lojinha) e no inventário (Meus itens).

// o que vem num pacote, no singular — os nomes dos itens se repetem ("Trans · Trans · Trans")
const BUNDLE_PART_LABEL: Record<ShopKind, string> = {
  bundle: 'Pacote',
  cardSkin: 'Card',
  avatarFrame: 'Moldura',
  postFrame: 'Borda',
  theme: 'Tema',
  calendarSkin: 'Calendário',
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

export default function ItemCard({ item, shop }: { item: ShopItem; shop: ShopState }) {
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
