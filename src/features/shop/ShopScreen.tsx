import { useState } from 'react'
import clsx from 'clsx'
import { Card, ScreenTitle } from '../../components/ui'
import { Coins } from '../../components/icons'
import { useShop } from '../../api/shop'
import { playSound } from '../../lib/sounds'
import ItemCard from './ItemCard'
import { SHOP_ITEMS, SHOP_KINDS, SHOP_KIND_LABEL, type ShopKind } from '../../../shared/shopCatalog'

const TAB_KEY = 'transapp.shopTab'

function readTab(): ShopKind {
  // link direto pra uma aba (ex.: "+3 na Lojinha" do Personalizar app): /loja#tab=avatarFrame
  const fromHash = window.location.hash.match(/^#tab=(\w+)$/)?.[1] as ShopKind | undefined
  if (fromHash && SHOP_KINDS.includes(fromHash)) return fromHash
  try {
    const saved = localStorage.getItem(TAB_KEY) as ShopKind | null
    if (saved && SHOP_KINDS.includes(saved)) return saved
  } catch {
    // sem storage (aba anônima) — começa na primeira
  }
  return SHOP_KINDS[0]
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
