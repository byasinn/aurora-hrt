import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { ArrowLeft, Coins, Lock, Potion } from '../../components/icons'
import { Button, Card } from '../../components/ui'
import { useIconStyle } from '../../components/AppIcon'
import { useBuyPotion, useShop } from '../../api/shop'
import { playSound } from '../../lib/sounds'
import { showToast, toastError } from '../../lib/toast'
import { PriceLabel, PromoBadge } from './ItemCard'
import { ItemModal, ItemRow } from './ItemRow'
import ShopStage, { KeeperMini, useKeeperTalk } from './ShopStage'
import { DEPARTMENT_BY_SLUG, type Department } from './departments'
import { SHOP_ITEMS, SHOP_ITEM_BY_KEY, SHOP_TAGS, itemTags, ownsItem, type ShopState, type ShopTag } from '../../../shared/shopCatalog'
import { POTION_OFFERS, POTION_OFFER_BY_KEY, discounted, type PotionOffer } from '../../../shared/shopPromos'
import Guide from '../../components/Guide'

function FilterChips({
  tags,
  active,
  onChange,
  hideOwned,
  onHideOwned,
}: {
  tags: ShopTag[]
  active: ShopTag | null
  onChange: (t: ShopTag | null) => void
  hideOwned: boolean
  onHideOwned: (v: boolean) => void
}) {
  const chip = (on: boolean) =>
    clsx(
      'min-h-9 rounded-full border px-3 text-sm font-bold transition',
      on ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
    )
  return (
    <div className="flex flex-wrap gap-1.5">
      <button className={chip(active === null)} onClick={() => onChange(null)}>
        Todos
      </button>
      {SHOP_TAGS.filter((t) => tags.includes(t.key)).map((t) => (
        <button key={t.key} className={chip(active === t.key)} onClick={() => onChange(active === t.key ? null : t.key)}>
          {t.label}
        </button>
      ))}
      <button className={chip(hideOwned)} onClick={() => onHideOwned(!hideOwned)}>
        Só o que não tenho
      </button>
    </div>
  )
}

function PotionOfferCard({ offer, shop }: { offer: PotionOffer; shop: ShopState }) {
  const buy = useBuyPotion()
  const promo = shop.promos?.[offer.key]
  const price = discounted(offer.price, promo?.percent ?? 0)
  const missing = price - shop.balance

  function handleBuy() {
    buy.mutate(offer.key, {
      onSuccess: () => {
        playSound('coin')
        showToast(`${offer.name} na sua bolsa! ✨`, 'info')
      },
      onError: (e) => {
        playSound('error')
        toastError(e)
      },
    })
  }

  return (
    <Card className="flex flex-col gap-3 p-3">
      <div className="relative flex h-24 items-center justify-center gap-1 rounded-2xl bg-[linear-gradient(160deg,#2e1065,#6d28d9)]">
        {Array.from({ length: offer.qty }, (_, i) => (
          <motion.span key={i} animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.3 }}>
            <Potion size={offer.qty > 1 ? 40 : 56} />
          </motion.span>
        ))}
        {promo && (
          <span className="absolute left-1.5 top-1.5">
            <PromoBadge percent={promo.percent} label={promo.label} />
          </span>
        )}
      </div>
      <div>
        <p className="font-extrabold leading-tight text-[var(--text)]">{offer.name}</p>
        <p className="text-xs text-[var(--text-muted)]">{offer.description}</p>
      </div>
      <Button size="sm" onClick={handleBuy} disabled={missing > 0 || buy.isPending} className="w-full">
        {missing > 0 && <Lock size={14} />}
        <PriceLabel price={price} full={promo ? offer.price : undefined} />
      </Button>
      {missing > 0 && <p className="-mt-1.5 text-center text-xs text-[var(--text-muted)]">Faltam {missing}</p>}
    </Card>
  )
}

/** Fala da vendedora sobre a promoção da loja dela (se tiver alguma valendo). */
function promoLineFor(dept: Department, shop: ShopState | undefined): string | null {
  if (!shop) return null
  const deals = Object.entries(shop.promos ?? {})
    .map(([key, promo]) => {
      const name = dept.kind === 'potion' ? POTION_OFFER_BY_KEY.get(key)?.name : SHOP_ITEM_BY_KEY.get(key)?.kind === dept.kind ? SHOP_ITEM_BY_KEY.get(key)?.name : undefined
      return name && !(dept.kind !== 'potion' && ownsItem(shop.owned, key)) ? { name, percent: promo.percent, daily: promo.label === 'Oferta do dia' } : null
    })
    .filter((d): d is NonNullable<typeof d> => !!d)
  if (deals.length === 0) return null
  if (deals.length === 1) {
    const d = deals[0]
    return `Psiu! ${d.daily ? 'Só hoje' : 'Tá em promoção'}: ${d.name} com ${d.percent}% de desconto!`
  }
  const names = deals.slice(0, 3).map((d) => d.name)
  return `Tem promoção aqui! ${names.slice(0, -1).join(', ')} e ${names[names.length - 1]} tão com desconto${deals.every((d) => d.daily) ? ' só hoje' : ''}!`
}

function DepartmentView({ dept }: { dept: Department }) {
  const { data: shop, isLoading } = useShop()
  const pixel = useIconStyle((s) => s.style) === 'pixel'
  const [tag, setTag] = useState<ShopTag | null>(null)
  const [hideOwned, setHideOwned] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [poke, setPoke] = useState(0)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const isPotions = dept.kind === 'potion'

  const promoLine = useMemo(() => promoLineFor(dept, shop), [dept, shop])
  const talk = useKeeperTalk({
    keeper: dept.keeper,
    poke,
    promoLine,
    message: filtersOpen ? 'O que você procura? Escolhe aqui!' : undefined,
    enabled: pixel,
  })

  // quando a cena grande sai da tela, a vendedora vira uma barrinha presa no topo
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageVisible, setStageVisible] = useState(true)
  useEffect(() => {
    const el = stageRef.current
    if (!el || !pixel) return
    const obs = new IntersectionObserver(([e]) => setStageVisible(e.isIntersecting), { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [pixel])

  const all = useMemo(() => SHOP_ITEMS.filter((i) => i.kind === dept.kind), [dept])
  const tags = useMemo(() => [...new Set(all.flatMap(itemTags))], [all])
  const items = all.filter((i) => (!tag || itemTags(i).includes(tag)) && (!hideOwned || !shop || !ownsItem(shop.owned, i.key)))
  const openItem = openKey ? (SHOP_ITEM_BY_KEY.get(openKey) ?? null) : null

  function keeperTap() {
    playSound('pop')
    if (isPotions) setPoke((n) => n + 1)
    else setFiltersOpen((v) => !v)
  }

  const filters = <FilterChips tags={tags} active={tag} onChange={setTag} hideOwned={hideOwned} onHideOwned={setHideOwned} />
  const filterHint = !isPotions && (
    <p className="font-pixel text-center text-sm text-[var(--accent)]">
      {tag ? (
        <button onClick={() => setTag(null)}>Filtro: {SHOP_TAGS.find((t) => t.key === tag)?.label} · limpar</button>
      ) : (
        `Toque em ${dept.keeper.name} pra abrir os filtros`
      )}
    </p>
  )
  const list = (
    <div className="space-y-2">
      {isLoading && <p className="text-sm text-[var(--text-muted)]">Abrindo a loja…</p>}
      {shop && isPotions && (
        <>
          <p className="flex items-center gap-2 rounded-2xl bg-[var(--surface-2)] px-3 py-2 text-sm">
            <Potion size={20} />
            <span>
              Você tem <b>{shop.potions}</b> {shop.potions === 1 ? 'poção' : 'poções'} — use em Missões → Semanal.
            </span>
          </p>
          {POTION_OFFERS.map((o) => (
            <PotionOfferCard key={o.key} offer={o} shop={shop} />
          ))}
        </>
      )}
      {shop && !isPotions && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {items.map((item) => (
            <ItemRow key={item.key} item={item} shop={shop} onOpen={() => (playSound('tap'), setOpenKey(item.key))} />
          ))}
        </div>
      )}
      {shop && !isPotions && items.length === 0 && <p className="py-6 text-center text-sm text-[var(--text-muted)]">Nada com esse filtro.</p>}
      {shop && <ItemModal item={openItem} shop={shop} onClose={() => setOpenKey(null)} />}
    </div>
  )

  return (
    <div className="space-y-4">
      {!isPotions && (
        <Guide
          id={pixel ? 'shop-keeper-1.3' : 'shop-filters-1.3'}
          steps={
            pixel
              ? [{ target: 'shop-keeper', title: 'Fale com a vendedora', text: 'Toque nela pra abrir os filtros. Ela também conta quando tem promoção!' }]
              : [{ target: 'shop-filters', title: 'Filtros da loja', text: 'Filtre por categoria — fofos, estilosos, gênero, sexualidade e mais.' }]
          }
        />
      )}
      <div className="flex items-center justify-between gap-3">
        <Link to="/loja" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
          <ArrowLeft size={16} /> Lojinha
        </Link>
        <span className="flex items-center gap-1 rounded-full bg-[var(--surface)] px-3 py-1.5 [box-shadow:var(--shadow)]">
          <Coins size={16} className="text-amber-500" />
          <span className="font-pixel text-lg font-bold text-[var(--text)]">{shop?.balance ?? '–'}</span>
        </span>
      </div>
      <div>
        <h1 className={clsx('text-2xl font-extrabold text-[var(--text)]', pixel && 'font-pixel')}>{dept.title}</h1>
        <p className="text-sm text-[var(--text-muted)]">{dept.blurb}</p>
      </div>

      {pixel ? (
        <div className="space-y-3 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start lg:gap-4 lg:space-y-0">
          <div className="space-y-3 lg:sticky lg:top-4">
            <div ref={stageRef} data-guide="shop-keeper">
              <ShopStage dept={dept} talk={talk} onKeeperClick={keeperTap} />
            </div>
            {!isPotions && (
              <AnimatePresence initial={false}>
                {filtersOpen && stageVisible ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-2xl border-[3px] border-[#2a1626] bg-[var(--surface)] p-3"
                  >
                    {filters}
                  </motion.div>
                ) : (
                  filterHint
                )}
              </AnimatePresence>
            )}
          </div>
          <div>
            {/* barrinha da vendedora: altura zero no fluxo, então aparecer não empurra a lista */}
            <div className="sticky top-2 z-30 h-0 lg:hidden">
              <AnimatePresence>
                {!stageVisible && (
                  <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.18 }}>
                    <KeeperMini dept={dept} talk={talk} onClick={keeperTap}>
                      {filtersOpen && <div className="mt-2 rounded-xl bg-[var(--surface)] p-2">{filters}</div>}
                    </KeeperMini>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {list}
          </div>
        </div>
      ) : (
        <>
          {!isPotions && <div data-guide="shop-filters">{filters}</div>}
          {list}
        </>
      )}
    </div>
  )
}

export default function ShopDepartmentScreen() {
  const { slug } = useParams<{ slug: string }>()
  const dept = slug ? DEPARTMENT_BY_SLUG.get(slug) : undefined
  if (!dept) return <Navigate to="/loja" replace />
  // key: trocar de loja recomeça a conversa e os filtros
  return <DepartmentView key={dept.slug} dept={dept} />
}
