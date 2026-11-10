import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { ArrowLeft, Coins } from '../../components/icons'
import PixelIcon from '../../components/PixelIcon'
import { useIconStyle } from '../../components/AppIcon'
import { useShop } from '../../api/shop'
import { playSound } from '../../lib/sounds'
import ItemCard from './ItemCard'
import { DEPARTMENT_BY_SLUG, type Department } from './departments'
import { SHOP_ITEMS, SHOP_TAGS, itemTags, ownsItem, type ShopTag } from '../../../shared/shopCatalog'

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

/** Vendedora atrás do balcão (só no 8-bit). Tocar nela abre os filtros. */
function Shopkeeper({ dept, onClick, talking }: { dept: Department; onClick: () => void; talking: boolean }) {
  return (
    <button onClick={onClick} className="group relative flex w-full flex-col items-center" aria-label={`Falar com ${dept.keeper.name} (filtros)`}>
      <motion.div animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
        <PixelIcon name={dept.keeper.sprite} palette={dept.keeper.palette} size={96} />
      </motion.div>
      {/* balcão de madeira */}
      <span className="-mt-3 block h-10 w-[112%] border-t-4 border-[#fde68a] bg-[#b7791f] [box-shadow:inset_0_-6px_0_#8a5a14,0_4px_0_rgba(0,0,0,0.15)]" />
      <span className="font-pixel mt-1.5 text-sm text-[var(--text)]">{dept.keeper.name}</span>
      {!talking && <span className="font-pixel text-[11px] text-[var(--accent)] group-active:opacity-60">toque aqui</span>}
    </button>
  )
}

export default function ShopDepartmentScreen() {
  const { slug } = useParams<{ slug: string }>()
  const dept = slug ? DEPARTMENT_BY_SLUG.get(slug) : undefined
  const { data: shop, isLoading } = useShop()
  const pixel = useIconStyle((s) => s.style) === 'pixel'
  const [tag, setTag] = useState<ShopTag | null>(null)
  const [hideOwned, setHideOwned] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const all = useMemo(() => SHOP_ITEMS.filter((i) => i.kind === dept?.kind), [dept])
  const tags = useMemo(() => [...new Set(all.flatMap(itemTags))], [all])
  if (!dept) return <Navigate to="/loja" replace />

  const items = all.filter((i) => (!tag || itemTags(i).includes(tag)) && (!hideOwned || !shop || !ownsItem(shop.owned, i.key)))
  const filters = <FilterChips tags={tags} active={tag} onChange={setTag} hideOwned={hideOwned} onHideOwned={setHideOwned} />
  const list = (
    <div className="space-y-3">
      {isLoading && <p className="text-sm text-[var(--text-muted)]">Abrindo a loja…</p>}
      {shop && items.map((item) => <ItemCard key={item.key} item={item} shop={shop} />)}
      {shop && items.length === 0 && <p className="py-6 text-center text-sm text-[var(--text-muted)]">Nada com esse filtro.</p>}
    </div>
  )

  return (
    <div className="space-y-4">
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
        <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 lg:grid-cols-[160px_minmax(0,1fr)]">
          <div className="sticky top-4 h-fit space-y-2">
            <Shopkeeper
              dept={dept}
              talking={filtersOpen}
              onClick={() => {
                playSound('pop')
                setFiltersOpen((v) => !v)
              }}
            />
          </div>
          <div className="space-y-3">
            {/* balão de fala da vendedora — vira o painel de filtros */}
            <div className="relative rounded-2xl border-2 border-[var(--text)] bg-[var(--surface)] p-3">
              <span className="absolute -left-2 top-6 h-3 w-3 rotate-45 border-b-2 border-l-2 border-[var(--text)] bg-[var(--surface)]" />
              <p className="font-pixel text-sm leading-snug text-[var(--text)]">
                {filtersOpen ? 'O que você procura?' : `${dept.keeper.greeting} Clique em mim pra abrir os filtros!`}
              </p>
              <AnimatePresence initial={false}>
                {filtersOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="pt-3">{filters}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {tag && !filtersOpen && (
              <button onClick={() => setTag(null)} className="text-xs font-bold text-[var(--accent)]">
                Filtro: {SHOP_TAGS.find((t) => t.key === tag)?.label} · limpar
              </button>
            )}
            {list}
          </div>
        </div>
      ) : (
        <>
          {filters}
          {list}
        </>
      )}
    </div>
  )
}
