import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Card, ScreenTitle } from '../../components/ui'
import { ChevronRight, Coins } from '../../components/icons'
import PixelIcon from '../../components/PixelIcon'
import { useIconStyle } from '../../components/AppIcon'
import { useShop } from '../../api/shop'
import { playSound } from '../../lib/sounds'
import ItemPreview from './ItemPreview'
import { DEPARTMENTS, DEPARTMENT_BY_KIND, type Department } from './departments'
import { SHOP_ITEMS, ownsItem, type ShopKind, type ShopState } from '../../../shared/shopCatalog'

// Lojinha: primeiro os departamentos (cards grandes), e cada um abre a sua loja
// (ShopDepartmentScreen). No 8-bit cada departamento tem uma vendedora.

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

function DepartmentCard({ dept, shop, pixel, wide }: { dept: Department; shop: ShopState | undefined; pixel: boolean; wide?: boolean }) {
  const items = SHOP_ITEMS.filter((i) => i.kind === dept.kind)
  const owned = shop ? items.filter((i) => ownsItem(shop.owned, i.key)).length : 0
  const featured = [...items].filter((i) => i.price > 0).sort((a, b) => b.price - a.price)[0]

  return (
    <Link to={`/loja/${dept.slug}`} onClick={() => playSound('tap')} className={clsx('block', wide && 'col-span-2')}>
      <Card className={clsx('btn-press-soft flex h-full gap-3 p-3 transition active:translate-y-0.5', wide ? 'items-center' : 'flex-col')}>
        <div
          className={clsx(
            'relative flex shrink-0 items-end justify-center overflow-hidden rounded-2xl',
            pixel ? 'bg-[var(--accent-soft)]' : 'bg-[var(--surface-2)]',
            wide ? 'h-24 w-28' : 'h-24 w-full',
          )}
        >
          {pixel ? (
            <>
              <PixelIcon name={dept.keeper.sprite} palette={dept.keeper.palette} size={72} className="relative z-0" />
              <span className="absolute inset-x-0 bottom-0 h-3 border-t-2 border-[#fde68a] bg-[#b7791f]" />
            </>
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
            {items.length} itens{owned > 0 ? ` · ${owned} seus` : ''}
            {pixel && ` · com ${dept.keeper.name}`}
          </p>
        </div>
        {wide && <ChevronRight size={18} className="shrink-0 text-[var(--text-muted)]" />}
      </Card>
    </Link>
  )
}

export default function ShopScreen() {
  const navigate = useNavigate()
  const { data: shop, isError } = useShop()
  const pixel = useIconStyle((s) => s.style) === 'pixel'

  // link antigo direto pra uma aba (/loja#tab=avatarFrame) vira o departamento
  useEffect(() => {
    const kind = window.location.hash.match(/^#tab=(\w+)$/)?.[1] as ShopKind | undefined
    const dept = kind ? DEPARTMENT_BY_KIND.get(kind) : undefined
    if (dept) navigate(`/loja/${dept.slug}`, { replace: true })
  }, [navigate])

  return (
    <div className="space-y-4">
      <ScreenTitle subtitle="Troque seu Brilho por enfeites pro seu perfil, seus posts e seu app.">Lojinha</ScreenTitle>
      <BalanceCard shop={shop} />
      <p className="-mt-2 px-1 text-xs text-[var(--text-muted)]">Comprar não tira seus títulos: eles contam todo o Brilho que você já ganhou.</p>
      {isError && <p className="text-sm text-[var(--text-muted)]">Não deu pra abrir a lojinha agora. Tenta de novo daqui a pouco.</p>}
      <div className="grid grid-cols-2 gap-3">
        {DEPARTMENTS.map((d, i) => (
          <DepartmentCard key={d.slug} dept={d} shop={shop} pixel={pixel} wide={i === 0} />
        ))}
      </div>
    </div>
  )
}
