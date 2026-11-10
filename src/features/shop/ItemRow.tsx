import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { Check, ChevronRight, X } from '../../components/icons'
import { useThemeStore } from '../../lib/themeStore'
import ItemCard, { PriceLabel, PromoBadge } from './ItemCard'
import ItemPreview from './ItemPreview'
import { DEFAULT_THEME, bundlePriceFor, ownsItem, type EquippableKind, type ShopItem, type ShopState } from '../../../shared/shopCatalog'
import { discounted } from '../../../shared/shopPromos'

// Vitrine compacta: cada item é uma linha (miniatura + nome + preço). Tocar abre o detalhe num
// modal, com a prévia grande e o botão de comprar/usar (o ItemCard de sempre).

/** A prévia do card grande, em escala menor (as prévias foram feitas pra ~160×96). */
function Thumb({ item }: { item: ShopItem }) {
  return (
    <div className="h-12 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-2)]">
      <div className="origin-top-left scale-50" style={{ width: 160, height: 96 }}>
        <ItemPreview item={item} />
      </div>
    </div>
  )
}

export function ItemRow({ item, shop, onOpen }: { item: ShopItem; shop: ShopState; onOpen: () => void }) {
  const mode = useThemeStore((t) => t.mode)
  const owned = ownsItem(shop.owned, item.key)
  const promo = shop.promos?.[item.key]
  const base = item.kind === 'bundle' ? bundlePriceFor(item, shop.owned) : item.price
  const price = discounted(base, promo?.percent ?? 0)
  const equippedKey = item.kind === 'theme' ? (shop.equipped.theme ?? DEFAULT_THEME[mode]) : shop.equipped[item.kind as EquippableKind]
  const inUse = equippedKey === item.key

  return (
    <button
      type="button"
      onClick={onOpen}
      className={clsx(
        'flex w-full items-center gap-3 rounded-2xl border bg-[var(--surface)] p-2 pr-3 text-left transition active:translate-y-0.5',
        inUse ? 'border-[var(--accent)]' : 'border-[var(--border)]',
      )}
    >
      <Thumb item={item} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold leading-tight text-[var(--text)]">{item.name}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs">
          {owned ? (
            <span className="flex items-center gap-1 font-bold text-[var(--accent)]">
              <Check size={12} /> {inUse ? 'usando' : 'seu'}
            </span>
          ) : item.price === 0 ? (
            <span className="font-bold text-emerald-600">grátis</span>
          ) : (
            <>
              <span className="flex items-center gap-1 text-[var(--text)]">
                <PriceLabel price={price} full={promo ? base : undefined} />
              </span>
              {promo && <PromoBadge percent={promo.percent} label={promo.label} />}
            </>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="shrink-0 text-[var(--text-muted)]" />
    </button>
  )
}

export function ItemModal({ item, shop, onClose }: { item: ShopItem | null; shop: ShopState; onClose: () => void }) {
  return createPortal(
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-end justify-center bg-black/50 p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:items-center sm:pb-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm [&_.h-24]:h-40 [&_.h-28]:h-44"
          >
            <button onClick={onClose} aria-label="Fechar" className="absolute right-3 top-3 z-10 rounded-full bg-[var(--surface)] p-1 text-[var(--text-muted)] [box-shadow:var(--shadow)]">
              <X size={16} />
            </button>
            <ItemCard item={item} shop={shop} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
