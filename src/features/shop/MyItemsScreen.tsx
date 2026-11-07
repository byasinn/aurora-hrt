import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Store } from '../../components/icons'
import clsx from 'clsx'
import { Card, EmptyState, ScreenTitle } from '../../components/ui'
import Avatar from '../../components/Avatar'
import { useShop } from '../../api/shop'
import { useProfile } from '../../api/profile'
import { playSound } from '../../lib/sounds'
import ItemCard from './ItemCard'
import { SHOP_ITEMS, SHOP_KIND_LABEL, ownsItem, type ShopKind } from '../../../shared/shopCatalog'

// pacote não aparece aqui: o que vem nele já entra item por item em cada aba
const KINDS: ShopKind[] = ['avatarFrame', 'cardSkin', 'postFrame', 'theme', 'calendarSkin']

/** Inventário: tudo que a pessoa tem (comprado ou grátis), separado por tipo, pra trocar o que está usando. */
export default function MyItemsScreen() {
  const { data: shop, isLoading } = useShop()
  const { data: profile } = useProfile()
  const [tab, setTab] = useState<ShopKind>('avatarFrame')

  const owned = (kind: ShopKind) => SHOP_ITEMS.filter((i) => i.kind === kind && ownsItem(shop?.owned ?? [], i.key))
  const items = shop ? owned(tab) : []

  return (
    <div className="space-y-4">
      <ScreenTitle subtitle="Escolha o que usar no seu perfil, nos seus posts e no app.">Meus itens</ScreenTitle>

      <Card className="flex items-center gap-4">
        <div className="p-1.5">
          <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} frame={profile?.equippedAvatarFrame} size={56} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[var(--text)]">{profile?.displayName}</p>
          <p className="text-sm text-[var(--text-muted)]">Assim te veem no feed</p>
        </div>
        <Link
          to="/loja"
          className="btn-press-soft flex min-h-10 shrink-0 items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm font-bold text-[var(--text)]"
        >
          <Store size={16} /> Lojinha
        </Link>
      </Card>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {KINDS.map((kind) => {
          const count = shop ? owned(kind).length : 0
          return (
            <button
              key={kind}
              onClick={() => {
                playSound('tap')
                setTab(kind)
              }}
              className={clsx(
                'flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-bold transition',
                tab === kind
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
              )}
            >
              {SHOP_KIND_LABEL[kind]}
              {count > 0 && <span className="text-xs opacity-80">{count}</span>}
            </button>
          )
        })}
      </div>

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando seus itens…</p>}
      {shop && items.length === 0 && (
        <EmptyState>
          Você ainda não tem {SHOP_KIND_LABEL[tab].toLowerCase()}.{' '}
          <Link to="/loja" className="font-bold text-[var(--accent)]">
            Ver na Lojinha
          </Link>
        </EmptyState>
      )}
      {shop && items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.key} item={item} shop={shop} />
          ))}
        </div>
      )}
    </div>
  )
}
