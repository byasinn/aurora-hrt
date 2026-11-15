import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Card, ScreenTitle } from '../../components/ui'
import { ChevronRight, Coins, Potion } from '../../components/icons'
import { useShop } from '../../api/shop'
import { playSound } from '../../lib/sounds'
import ItemPreview from './ItemPreview'
import { PromoBadge } from './ItemCard'
import { DEPARTMENTS, DEPARTMENT_BY_KIND, type Department } from './departments'
import { SHOP_ITEMS, SHOP_ITEM_BY_KEY, ownsItem, type ShopKind, type ShopState } from '../../../shared/shopCatalog'
import { POTION_OFFERS, POTION_OFFER_BY_KEY } from '../../../shared/shopPromos'
import Guide from '../../components/Guide'

// Lojinha: primeiro os departamentos (cards grandes, com o que vende — as vendedoras aparecem lá
// dentro, no 8-bit), e cada um abre a sua loja (ShopDepartmentScreen).

export function BalanceCard({ shop }: { shop: ShopState | undefined }) {
  return (
    <Card className="flex items-center gap-4">
      <Coins size={44} className="text-amber-500" />
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
  )
}

function DepartmentCard({ dept, shop, wide }: { dept: Department; shop: ShopState | undefined; wide?: boolean }) {
  const isPotions = dept.kind === 'potion'
  const items = isPotions ? [] : SHOP_ITEMS.filter((i) => i.kind === dept.kind)
  const owned = shop ? items.filter((i) => ownsItem(shop.owned, i.key)).length : 0
  const featured = [...items].filter((i) => i.price > 0).sort((a, b) => b.price - a.price)[0]
  const onSale = shop ? Object.keys(shop.promos ?? {}).some((k) => (isPotions ? POTION_OFFER_BY_KEY.has(k) : SHOP_ITEM_BY_KEY.get(k)?.kind === dept.kind)) : false

  return (
    <Link to={`/loja/${dept.slug}`} onClick={() => playSound('tap')} className={clsx('block', wide && 'col-span-2')}>
      <Card className={clsx('btn-press-soft relative flex h-full gap-3 p-3 transition active:translate-y-0.5', wide ? 'items-center' : 'flex-col')}>
        {onSale && <span className="absolute right-2 top-2 z-10 rounded-md bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">promo</span>}
        <div
          className={clsx(
            'relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl',
            isPotions ? 'bg-[linear-gradient(160deg,#2e1065,#6d28d9)]' : 'bg-[var(--surface-2)]',
            wide ? 'h-24 w-28' : 'h-24 w-full',
          )}
        >
          {isPotions ? (
            <span className="flex gap-1">
              <Potion size={40} />
              <Potion size={52} />
              <Potion size={40} />
            </span>
          ) : (
            featured && (
              <div className="h-full w-full p-2">
                <ItemPreview item={featured} />
              </div>
            )
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-extrabold leading-tight text-[var(--text)]">{dept.title}</p>
          <p className="text-xs text-[var(--text-muted)]">{dept.blurb}</p>
          <p className="mt-1 text-[11px] font-bold text-[var(--accent)]">
            {isPotions ? `${POTION_OFFERS.length} frascos` : `${items.length} itens${owned > 0 ? ` · ${owned} seus` : ''}`}
          </p>
        </div>
        {wide && <ChevronRight size={18} className="shrink-0 text-[var(--text-muted)]" />}
      </Card>
    </Link>
  )
}

/** O que está com desconto agora (ofertas do dia + promoções do admin). */
function TodayDeals({ shop }: { shop: ShopState }) {
  const deals = Object.entries(shop.promos ?? {})
    .map(([key, promo]) => {
      const item = SHOP_ITEM_BY_KEY.get(key)
      const potion = POTION_OFFER_BY_KEY.get(key)
      const dept = item ? DEPARTMENT_BY_KIND.get(item.kind) : potion ? DEPARTMENT_BY_KIND.get('potion') : undefined
      if (!dept || (item && ownsItem(shop.owned, item.key))) return null
      return { key, name: item?.name ?? potion?.name ?? key, dept, promo }
    })
    .filter((d): d is NonNullable<typeof d> => !!d)
    .slice(0, 8)
  if (deals.length === 0) return null
  return (
    <Card className="space-y-2" data-guide="shop-deals">
      <p className="font-bold">Em promoção</p>
      <div className="space-y-1.5">
        {deals.map((d) => (
          <Link key={d.key} to={`/loja/${d.dept.slug}`} className="flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-sm">
            <PromoBadge percent={d.promo.percent} label={d.promo.label} />
            <span className="min-w-0 flex-1 truncate font-bold">{d.name}</span>
            <span className="shrink-0 text-xs text-[var(--text-muted)]">{d.dept.title}</span>
          </Link>
        ))}
      </div>
    </Card>
  )
}

export default function ShopScreen() {
  const navigate = useNavigate()
  const { data: shop, isError } = useShop()

  // link antigo direto pra uma aba (/loja#tab=avatarFrame) vira o departamento
  useEffect(() => {
    const kind = window.location.hash.match(/^#tab=(\w+)$/)?.[1] as ShopKind | undefined
    const dept = kind ? DEPARTMENT_BY_KIND.get(kind) : undefined
    if (dept) navigate(`/loja/${dept.slug}`, { replace: true })
  }, [navigate])

  return (
    <div className="space-y-4">
      <Guide
        id="shop-1.3"
        steps={[
          { target: 'shop-deals', title: 'Ofertas do dia', text: 'Todo dia alguns itens ganham desconto — às vezes tem promoção especial também.' },
          { target: 'shop-departments', title: 'Uma loja pra cada coisa', text: 'Molduras, cards, bordas, temas, calendários… e uma loja de poções!' },
        ]}
      />
      <ScreenTitle subtitle="Troque seu Brilho por enfeites pro seu perfil, seus posts e seu app.">Lojinha</ScreenTitle>
      <BalanceCard shop={shop} />
      <p className="-mt-2 px-1 text-xs text-[var(--text-muted)]">Comprar não tira seus títulos: eles contam todo o Brilho que você já ganhou.</p>
      {isError && <p className="text-sm text-[var(--text-muted)]">Não deu pra abrir a lojinha agora. Tenta de novo daqui a pouco.</p>}
      {shop && <TodayDeals shop={shop} />}
      <div className="grid grid-cols-2 gap-3" data-guide="shop-departments">
        {DEPARTMENTS.map((d, i) => (
          <DepartmentCard key={d.slug} dept={d} shop={shop} wide={i === 0 || d.kind === 'potion'} />
        ))}
      </div>
    </div>
  )
}
