import { useState, type CSSProperties } from 'react'
import { Check, Lock } from 'lucide-react'
import clsx from 'clsx'
import { Button, Card, ScreenTitle } from '../../components/ui'
import Avatar from '../../components/Avatar'
import PixelIcon from '../../components/PixelIcon'
import { useShop, useBuyItem, useEquipItem } from '../../api/shop'
import { useProfile } from '../../api/profile'
import { useThemeStore } from '../../lib/themeStore'
import { playSound } from '../../lib/sounds'
import { showToast, toastError } from '../../lib/toast'
import { CALENDAR_SKINS, CARD_SKINS, POST_FRAMES, THEMES } from '../../lib/shopVisuals'
import {
  SHOP_ITEMS,
  SHOP_KINDS,
  SHOP_KIND_LABEL,
  ownsItem,
  type EquippableKind,
  type ShopItem,
  type ShopKind,
  type ShopState,
} from '../../../shared/shopCatalog'

const TAB_KEY = 'transapp.shopTab'

function readTab(): ShopKind {
  try {
    const saved = localStorage.getItem(TAB_KEY) as ShopKind | null
    if (saved && SHOP_KINDS.includes(saved)) return saved
  } catch {
    // sem storage (aba anônima) — começa na primeira
  }
  return 'cardSkin'
}

function Preview({ item }: { item: ShopItem }) {
  const { data: profile } = useProfile()

  if (item.kind === 'cardSkin') {
    const skin = CARD_SKINS[item.key]
    return (
      <div
        className={clsx('flex h-full items-center px-3 text-sm font-semibold', skin.pixel ? 'pixel-frame m-[3px] !rounded-none' : 'rounded-2xl')}
        style={{ ...skin.style, color: skin.color, paddingLeft: skin.paddingLeft, ...(skin.pixel ? ({ '--pf': '#9c59d1' } as CSSProperties) : {}) }}
      >
        Oi, gente! ✨
      </div>
    )
  }

  if (item.kind === 'avatarFrame') {
    return (
      <div className="flex h-full items-center justify-center">
        <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} frame={item.key} size={52} />
      </div>
    )
  }

  if (item.kind === 'postFrame') {
    const frame = POST_FRAMES[item.key]
    const inner = (
      <div className={clsx('h-full space-y-1.5 bg-[var(--surface)] p-2.5', frame.pixel ? 'rounded-none' : 'rounded-[14px]')}>
        <div className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded-full bg-[var(--accent-soft)]" />
          <span className="h-2 w-12 rounded-full bg-[var(--surface-2)]" />
        </div>
        <span className="block h-2 w-full rounded-full bg-[var(--surface-2)]" />
        <span className="block h-2 w-2/3 rounded-full bg-[var(--surface-2)]" />
      </div>
    )
    return frame.pixel ? (
      <div className="pixel-frame m-1 h-[calc(100%-0.5rem)]" style={{ '--pf': frame.border, '--pf-size': '4px' } as CSSProperties}>
        {inner}
      </div>
    ) : (
      <div className="h-full rounded-[17px] p-[3px]" style={{ background: frame.border, boxShadow: frame.glow }}>
        {inner}
      </div>
    )
  }

  if (item.kind === 'theme') {
    const theme = THEMES[item.key]
    const dark = theme.mode === 'dark'
    return (
      <div
        className="flex h-full items-end gap-1.5 rounded-2xl p-3"
        style={{
          background: dark
            ? 'radial-gradient(1px 1px at 20% 30%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 70% 20%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 45% 60%, #fde68a 50%, transparent 51%), linear-gradient(160deg, #0e1015, #2e1065)'
            : theme.skin === 'retro'
              ? `linear-gradient(${theme.accent2}33 1px, transparent 1px) 0 0 / 10px 10px, linear-gradient(90deg, ${theme.accent2}33 1px, #faf7f8 1px) 0 0 / 10px 10px`
              : `linear-gradient(160deg, #ffffff, ${theme.accent}26)`,
        }}
      >
        {[theme.accent, theme.accent2, theme.accent3].map((c) => (
          <span key={c} className="h-6 w-6 rounded-full border-2 border-white/80" style={{ background: c }} />
        ))}
      </div>
    )
  }

  const cal = CALENDAR_SKINS[item.key]
  return (
    <div className={clsx('h-full p-2', cal.cardClass ?? 'rounded-2xl bg-[var(--surface)]')} style={cal.cardStyle}>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 14 }, (_, i) => (
          <span
            key={i}
            className={clsx('flex aspect-square items-center justify-center text-[9px] font-bold', cal.dayShape, cal.emptyDayClass(i % 7))}
            style={i === 3 ? { background: '#10b981', color: '#fff' } : cal.emptyDayStyle?.(i % 7)}
          >
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  )
}

function ItemCard({ item, shop }: { item: ShopItem; shop: ShopState }) {
  const buy = useBuyItem()
  const equip = useEquipItem()
  const theme = useThemeStore()
  const owned = ownsItem(shop.owned, item.key)
  const equippedKey = item.kind === 'cardSkin' ? null : shop.equipped[item.kind as EquippableKind]
  const isEquipped = equippedKey === item.key
  const missing = item.price - shop.balance

  async function handleBuy() {
    try {
      await buy.mutateAsync(item.key)
      playSound('coin')
      showToast(`${item.name} é seu! ✨`, 'info')
    } catch (err) {
      playSound('error')
      toastError(err, 'Não deu pra comprar agora. Tenta de novo.')
    }
  }

  async function handleEquip() {
    const kind = item.kind as EquippableKind
    try {
      await equip.mutateAsync({ kind, itemKey: isEquipped ? null : item.key })
      playSound(isEquipped ? 'toggle' : 'success')
      // tema também troca as cores de acento — dá pra ajustar depois em Aparência
      if (kind === 'theme' && !isEquipped) {
        const visual = THEMES[item.key]
        theme.setAccent(visual.accent, visual.accent2)
        theme.setAccent3(visual.accent3)
        if (visual.mode) theme.setMode(visual.mode)
      }
    } catch (err) {
      toastError(err, 'Não deu pra usar esse item agora.')
    }
  }

  return (
    <Card className={clsx('flex flex-col gap-3 p-3', isEquipped && 'border-[var(--accent)] border-2')}>
      <div className="relative h-24">
        <Preview item={item} />
        {item.pixel && (
          <span className="font-pixel absolute right-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] uppercase text-white">8-bit</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold leading-tight text-[var(--text)]">{item.name}</p>
        <p className="text-xs text-[var(--text-muted)]">{item.description}</p>
      </div>

      {!owned ? (
        <Button size="sm" onClick={handleBuy} disabled={missing > 0 || buy.isPending} className="w-full">
          {missing > 0 ? <Lock size={14} /> : <PixelIcon name="coin" size={14} />}
          <span className="font-pixel text-[15px]">{item.price}</span>
        </Button>
      ) : item.kind === 'cardSkin' ? (
        <p className="flex min-h-9 items-center justify-center gap-1 rounded-2xl bg-[var(--accent-soft)] text-sm font-bold text-[var(--text)]">
          <Check size={14} /> Seu · escolha ao postar
        </p>
      ) : (
        <Button size="sm" variant={isEquipped ? 'secondary' : 'primary'} onClick={handleEquip} disabled={equip.isPending} className="w-full">
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
