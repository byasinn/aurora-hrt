import { useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Smartphone, Volume2 } from 'lucide-react'
import { Check, ChevronRight, Gem, Store, X } from '../../components/icons'
import { Card, ScreenTitle } from '../../components/ui'
import Avatar from '../../components/Avatar'
import Switch from '../../components/Switch'
import VisualStylePicker from '../../components/VisualStylePicker'
import { useProfile, useUpdateProfile } from '../../api/profile'
import { useShop, useEquipItem } from '../../api/shop'
import { useThemeStore } from '../../lib/themeStore'
import { playSound, useSoundStore } from '../../lib/sounds'
import { toastError } from '../../lib/toast'
import ItemPreview, { ThemeSwatch } from '../shop/ItemPreview'
import { DEFAULT_THEME, SHOP_ITEMS, ownsItem, type EquippableKind } from '../../../shared/shopCatalog'
import { DEPARTMENT_BY_KIND } from '../shop/departments'

// Personalizar app (central do Aurora): tudo que muda o visual num lugar só, com prévia ao vivo e só
// com o que a pessoa já tem — o resto fica a um toque, na Lojinha. Substitui a antiga tela de Aparência.

type Tab = 'theme' | 'visual' | 'avatarFrame' | 'postFrame' | 'calendarSkin' | 'app'

const TABS: { key: Tab; label: string }[] = [
  { key: 'theme', label: 'Tema' },
  { key: 'visual', label: 'Visual' },
  { key: 'avatarFrame', label: 'Moldura' },
  { key: 'postFrame', label: 'Borda dos posts' },
  { key: 'calendarSkin', label: 'Calendário' },
  { key: 'app', label: 'Ícone e sons' },
]

const TAB_KEY = 'transapp.customizeTab'

const ICON_VARIANTS = [
  { key: 'default', label: 'Rosa & Azul' },
  { key: 'dourado', label: 'Dourado & Lavanda' },
  { key: 'esmeralda', label: 'Esmeralda & Rosa' },
  { key: 'turquesa', label: 'Turquesa & Areia' },
  { key: 'lilas', label: 'Lilás & Menta' },
]

function readTab(): Tab {
  try {
    const saved = localStorage.getItem(TAB_KEY)
    if (saved && TABS.some((t) => t.key === saved)) return saved as Tab
  } catch {
    // sem localStorage: começa no tema
  }
  return 'theme'
}

function itemName(key: string | null | undefined): string {
  if (!key) return 'Nenhuma'
  return SHOP_ITEMS.find((i) => i.key === key)?.name ?? key
}

/** Grade de itens que a pessoa tem de um tipo, pra equipar com um toque. */
function OwnedGrid({ kind, allowNone }: { kind: EquippableKind; allowNone: boolean }) {
  const { data: shop } = useShop()
  const { data: profile } = useProfile()
  const mode = useThemeStore((s) => s.mode)
  const equip = useEquipItem()
  const all = SHOP_ITEMS.filter((i) => i.kind === kind)
  const owned = all.filter((i) => ownsItem(shop?.owned ?? [], i.key))
  const missing = all.length - owned.length
  const current = kind === 'theme' ? (profile?.equippedTheme ?? DEFAULT_THEME[mode]) : (shop?.equipped[kind] ?? null)

  function choose(itemKey: string | null) {
    if (itemKey === current) return
    playSound(itemKey ? 'success' : 'tap')
    equip.mutate({ kind, itemKey }, { onError: (err) => toastError(err, 'Não deu pra trocar agora.') })
  }

  const tile = 'relative flex flex-col overflow-hidden rounded-2xl border-2 text-left transition active:scale-[0.97]'

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {allowNone && (
        <button type="button" onClick={() => choose(null)} className={clsx(tile, current == null ? 'border-[var(--accent)]' : 'border-[var(--border)]')}>
          <span className="flex h-24 items-center justify-center bg-[var(--surface-2)] text-[var(--text-muted)]">
            <X size={22} />
          </span>
          <span className="px-3 py-2 text-sm font-bold text-[var(--text)]">Nenhuma</span>
        </button>
      )}
      {owned.map((item) => {
        const selected = current === item.key
        return (
          <button key={item.key} type="button" onClick={() => choose(item.key)} className={clsx(tile, selected ? 'border-[var(--accent)]' : 'border-[var(--border)]')}>
            <span className="flex h-24 items-center justify-center overflow-hidden bg-[var(--surface-2)]">
              {kind === 'theme' ? <ThemeSwatch itemKey={item.key} className="h-full w-full rounded-none" /> : <ItemPreview item={item} />}
            </span>
            <span className="flex items-center justify-between gap-1 px-3 py-2 text-sm font-bold text-[var(--text)]">
              <span className="truncate">{item.name}</span>
              {selected && <Check size={15} className="shrink-0 text-[var(--accent)]" />}
            </span>
          </button>
        )
      })}
      {missing > 0 && (
        <Link
          to={`/loja/${DEPARTMENT_BY_KIND.get(kind)?.slug ?? ''}`}
          className={clsx(tile, 'items-center justify-center gap-1 border-dashed border-[var(--border)] p-4 text-center text-[var(--text-muted)]')}
        >
          <Store size={22} className="text-[var(--accent)]" />
          <span className="text-sm font-bold text-[var(--text)]">+{missing} na Lojinha</span>
          <span className="text-xs">Troque seu Brilho</span>
        </Link>
      )}
    </div>
  )
}

function AppTab() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const sounds = useSoundStore()

  return (
    <div className="space-y-3">
      <Card className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Volume2 size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-[var(--text)]">Sons</span>
          <span className="block text-xs text-[var(--text-muted)]">Barulhinhos ao tomar dose, curtir e navegar</span>
        </span>
        <Switch
          checked={sounds.enabled}
          onChange={(on) => {
            sounds.setEnabled(on)
            if (on) setTimeout(() => playSound('success'), 80)
          }}
        />
      </Card>
      <Card className="space-y-2">
        <p className="font-bold text-[var(--text)]">Ícone do app</p>
        <p className="text-xs text-[var(--text-muted)]">
          Depois de trocar, remova o app da tela de início e adicione de novo — o sistema não atualiza sozinho um ícone já instalado.
        </p>
        <div className="flex flex-wrap gap-3">
          {ICON_VARIANTS.map((v) => {
            const selected = (profile?.appIconVariant ?? 'default') === v.key
            const iconSrc = v.key === 'default' ? '/icons/icon-192.png' : `/icons/variants/${v.key}/icon-192.png`
            return (
              <button key={v.key} type="button" onClick={() => updateProfile.mutate({ appIconVariant: v.key })} className="flex flex-col items-center gap-1" title={v.label}>
                <span className="relative">
                  <img src={iconSrc} alt={v.label} className={clsx('h-14 w-14 rounded-2xl border-2', selected ? 'border-[var(--accent)]' : 'border-[var(--border)]')} />
                  {selected && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
                      <Check size={11} />
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </Card>
      <Link to="/settings/instalar" className="block">
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Smartphone size={18} />
          </span>
          <span className="flex-1 font-bold text-[var(--text)]">Instalar o app</span>
          <ChevronRight size={18} className="text-[var(--text-muted)]" />
        </Card>
      </Link>
    </div>
  )
}

export default function CustomizeScreen() {
  const { data: profile } = useProfile()
  const { data: shop } = useShop()
  const mode = useThemeStore((s) => s.mode)
  const [tab, setTabState] = useState<Tab>(readTab)
  const themeKey = profile?.equippedTheme ?? DEFAULT_THEME[mode]

  function setTab(next: Tab) {
    playSound('tap')
    setTabState(next)
    try {
      localStorage.setItem(TAB_KEY, next)
    } catch {
      // só não lembra a aba
    }
  }

  const postFrame = shop?.equipped.postFrame ? SHOP_ITEMS.find((i) => i.key === shop.equipped.postFrame) : null
  const calendar = shop?.equipped.calendarSkin ? SHOP_ITEMS.find((i) => i.key === shop.equipped.calendarSkin) : null

  return (
    <div className="space-y-4">
      <ScreenTitle subtitle="Tema, visual e os itens que você tem — muda na hora.">Personalizar app</ScreenTitle>

      {/* prévia ao vivo: o que está em uso agora */}
      <Card className="overflow-hidden p-0">
        <ThemeSwatch itemKey={themeKey} className="h-16 rounded-none" />
        <div className="-mt-9 flex items-end gap-3 px-4">
          <div className="p-1.5">
            <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} frame={profile?.equippedAvatarFrame} size={64} showOrnaments />
          </div>
          <div className="min-w-0 pb-2">
            <p className="truncate font-bold text-[var(--text)]">{profile?.displayName}</p>
            <p className="truncate text-xs text-[var(--text-muted)]">Moldura: {itemName(profile?.equippedAvatarFrame)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3 pt-1">
          {[
            { label: 'Tema', name: itemName(themeKey), node: <ThemeSwatch itemKey={themeKey} className="h-full w-full rounded-none" />, tab: 'theme' as Tab },
            { label: 'Borda', name: postFrame?.name ?? 'Nenhuma', node: postFrame ? <ItemPreview item={postFrame} /> : null, tab: 'postFrame' as Tab },
            { label: 'Calendário', name: calendar?.name ?? 'Padrão', node: calendar ? <ItemPreview item={calendar} /> : null, tab: 'calendarSkin' as Tab },
          ].map((p) => (
            <button key={p.label} type="button" onClick={() => setTab(p.tab)} className="overflow-hidden rounded-xl border border-[var(--border)] text-left">
              <span className="flex h-14 items-center justify-center overflow-hidden bg-[var(--surface-2)] text-xs text-[var(--text-muted)]">{p.node ?? '—'}</span>
              <span className="block px-2 py-1">
                <span className="block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{p.label}</span>
                <span className="block truncate text-xs font-bold text-[var(--text)]">{p.name}</span>
              </span>
            </button>
          ))}
        </div>
      </Card>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={clsx(
              'min-h-10 shrink-0 rounded-full border-2 px-4 text-sm font-bold transition',
              tab === t.key ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'theme' && <OwnedGrid kind="theme" allowNone={false} />}
      {tab === 'visual' && (
        <Card>
          <VisualStylePicker />
        </Card>
      )}
      {tab === 'avatarFrame' && <OwnedGrid kind="avatarFrame" allowNone />}
      {tab === 'postFrame' && <OwnedGrid kind="postFrame" allowNone />}
      {tab === 'calendarSkin' && <OwnedGrid kind="calendarSkin" allowNone />}
      {tab === 'app' && <AppTab />}

      <div className="grid grid-cols-2 gap-3 pt-1">
        <Link to="/meus-itens" className="btn-press-soft flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] font-bold text-[var(--text)]">
          <Gem size={18} className="text-[var(--accent)]" /> Meus itens
        </Link>
        <Link to="/loja" className="btn-press flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-bold text-[var(--accent-contrast)]">
          <Store size={18} /> Lojinha
        </Link>
      </div>
    </div>
  )
}
