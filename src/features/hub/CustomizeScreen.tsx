import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { Smartphone, Volume2, VolumeX } from 'lucide-react'
import { Check, ChevronRight, Gem, Sparkles, Store, X } from '../../components/icons'
import { Button, Card, ScreenTitle } from '../../components/ui'
import Avatar from '../../components/Avatar'
import Switch from '../../components/Switch'
import PixelIcon from '../../components/PixelIcon'
import VisualStylePicker from '../../components/VisualStylePicker'
import { useIconStyle } from '../../components/AppIcon'
import { useProfile, useUpdateProfile } from '../../api/profile'
import { useShop, useEquipItem } from '../../api/shop'
import { useThemeStore } from '../../lib/themeStore'
import { playSound, useSoundStore } from '../../lib/sounds'
import { toastError } from '../../lib/toast'
import ItemPreview, { ThemeSwatch } from '../shop/ItemPreview'
import { ScaledPreview } from '../shop/ItemRow'
import { DEFAULT_THEME, SHOP_ITEM_BY_KEY, SHOP_ITEMS, ownsItem, type EquippableKind } from '../../../shared/shopCatalog'
import { DEPARTMENT_BY_KIND } from '../shop/departments'
import Guide from '../../components/Guide'

// Personalizar app (central do Aurora): prévia ao vivo em cima e uma grade com cada parte do app
// mostrando o que está em uso. Tocar numa parte abre uma gaveta de baixo com as opções (só o que a
// pessoa já tem — o resto fica a um toque, na Lojinha); a prévia continua visível e muda na hora.

type Part = 'theme' | 'visual' | 'avatarFrame' | 'postFrame' | 'calendarSkin' | 'app'

const PART_TITLE: Record<Part, string> = {
  theme: 'Tema',
  visual: 'Visual',
  avatarFrame: 'Moldura',
  postFrame: 'Borda dos posts',
  calendarSkin: 'Calendário',
  app: 'Ícone e sons',
}

const ICON_VARIANTS = [
  { key: 'default', label: 'Rosa & Azul' },
  { key: 'dourado', label: 'Dourado & Lavanda' },
  { key: 'esmeralda', label: 'Esmeralda & Rosa' },
  { key: 'turquesa', label: 'Turquesa & Areia' },
  { key: 'lilas', label: 'Lilás & Menta' },
]

const iconSrc = (variant: string) => (variant === 'default' ? '/icons/icon-192.png' : `/icons/variants/${variant}/icon-192.png`)

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
          <span className="flex h-20 items-center justify-center bg-[var(--surface-2)] text-[var(--text-muted)]">
            <X size={22} />
          </span>
          <span className="px-3 py-2 text-sm font-bold text-[var(--text)]">Nenhuma</span>
        </button>
      )}
      {owned.map((item) => {
        const selected = current === item.key
        return (
          <button key={item.key} type="button" onClick={() => choose(item.key)} className={clsx(tile, selected ? 'border-[var(--accent)]' : 'border-[var(--border)]')}>
            <span className="flex h-20 items-center justify-center overflow-hidden bg-[var(--surface-2)]">
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

function AppOptions() {
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
          <span className="block text-xs text-[var(--text-muted)]">Barulhinhos ao tomar dose, curtir, navegar e na lojinha</span>
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
            return (
              <button key={v.key} type="button" onClick={() => updateProfile.mutate({ appIconVariant: v.key })} className="flex flex-col items-center gap-1" title={v.label}>
                <span className="relative">
                  <img src={iconSrc(v.key)} alt={v.label} className={clsx('h-14 w-14 rounded-2xl border-2', selected ? 'border-[var(--accent)]' : 'border-[var(--border)]')} />
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

/** Gaveta que sobe de baixo com as opções de uma parte. A prévia em cima continua aparecendo. */
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[95] flex items-end justify-center bg-black/30" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[62dvh] w-full max-w-md flex-col rounded-t-3xl border-t border-[var(--border)] bg-[var(--surface)] [box-shadow:0_-10px_30px_rgba(0,0,0,0.15)] lg:max-w-2xl"
      >
        <div className="flex items-center gap-2 px-4 pb-2 pt-3">
          <span className="mx-auto h-1.5 w-10 rounded-full bg-[var(--border)]" />
        </div>
        <div className="flex items-center justify-between px-4 pb-3">
          <p className="text-lg font-extrabold text-[var(--text)]">{title}</p>
          <button onClick={onClose} aria-label="Fechar" className="rounded-full p-1 text-[var(--text-muted)]">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        <div className="border-t border-[var(--border)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <Button className="w-full" onClick={onClose}>
            Pronto
          </Button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}

function PartTile({ label, value, active, onClick, children }: { label: string; value: string; active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'btn-press-soft flex flex-col overflow-hidden rounded-2xl border-2 bg-[var(--surface)] text-left transition active:translate-y-0.5',
        active ? 'border-[var(--accent)]' : 'border-[var(--border)]',
      )}
    >
      <span className="flex h-16 items-center justify-center overflow-hidden bg-[var(--surface-2)]">{children}</span>
      <span className="block px-2.5 py-2">
        <span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
        <span className="block truncate text-sm font-bold text-[var(--text)]">{value}</span>
      </span>
    </button>
  )
}

export default function CustomizeScreen() {
  const { data: profile } = useProfile()
  const { data: shop } = useShop()
  const mode = useThemeStore((s) => s.mode)
  const visual = useIconStyle((s) => s.style)
  const soundsOn = useSoundStore((s) => s.enabled)
  const [part, setPart] = useState<Part | null>(null)
  const themeKey = profile?.equippedTheme ?? DEFAULT_THEME[mode]
  const frameKey = profile?.equippedAvatarFrame ?? null
  const postFrame = shop?.equipped.postFrame ? SHOP_ITEM_BY_KEY.get(shop.equipped.postFrame) : undefined
  const calendar = shop?.equipped.calendarSkin ? SHOP_ITEM_BY_KEY.get(shop.equipped.calendarSkin) : undefined

  function open(next: Part) {
    playSound('pop')
    setPart(next)
  }

  return (
    <div className="space-y-4">
      <Guide
        id="customize-1.3"
        steps={[
          { target: 'customize-parts', title: 'Toque numa parte', text: 'Abre as opções que você tem e muda na hora — a prévia em cima mostra como ficou.' },
        ]}
      />
      <ScreenTitle subtitle="Toque numa parte pra trocar — muda na hora.">Personalizar app</ScreenTitle>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/meus-itens" className="btn-press-soft flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] font-bold text-[var(--text)]">
          <Gem size={18} className="text-[var(--accent)]" /> Meus itens
        </Link>
        <Link to="/loja" className="btn-press flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-bold text-[var(--accent-contrast)]">
          <Store size={18} /> Lojinha
        </Link>
      </div>

      {/* prévia ao vivo: o que está em uso agora */}
      <Card className="overflow-hidden p-0">
        <ThemeSwatch itemKey={themeKey} className="h-16 rounded-none" />
        <div className="-mt-9 flex items-end gap-3 px-4">
          <div className="p-1.5">
            <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} frame={frameKey} size={64} showOrnaments />
          </div>
          <div className="min-w-0 pb-2">
            <p className="truncate font-bold text-[var(--text)]">{profile?.displayName}</p>
            <p className="truncate text-xs text-[var(--text-muted)]">{visual === 'pixel' ? 'Visual 8-bit' : 'Visual Clean'}</p>
          </div>
        </div>
        <div className="p-3 pt-1">
          <div className="h-20 overflow-hidden rounded-2xl">
            {postFrame ? (
              <ItemPreview item={postFrame} />
            ) : (
              <div className="h-full space-y-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-4 w-4 rounded-full bg-[var(--accent-soft)]" />
                  <span className="h-2 w-12 rounded-full bg-[var(--surface-2)]" />
                </div>
                <span className="block h-2 w-full rounded-full bg-[var(--surface-2)]" />
                <span className="block h-2 w-2/3 rounded-full bg-[var(--surface-2)]" />
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2.5" data-guide="customize-parts">
        <PartTile label="Tema" value={SHOP_ITEM_BY_KEY.get(themeKey)?.name ?? 'Padrão'} active={part === 'theme'} onClick={() => open('theme')}>
          <ThemeSwatch itemKey={themeKey} className="h-full w-full rounded-none" />
        </PartTile>
        <PartTile label="Visual" value={visual === 'pixel' ? '8-bit' : 'Clean'} active={part === 'visual'} onClick={() => open('visual')}>
          {visual === 'pixel' ? <PixelIcon name="star" size={30} /> : <Sparkles size={28} className="text-[var(--accent)]" />}
        </PartTile>
        <PartTile label="Moldura" value={frameKey ? (SHOP_ITEM_BY_KEY.get(frameKey)?.name ?? '—') : 'Nenhuma'} active={part === 'avatarFrame'} onClick={() => open('avatarFrame')}>
          <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} frame={frameKey} size={40} />
        </PartTile>
        <PartTile label="Borda" value={postFrame?.name ?? 'Nenhuma'} active={part === 'postFrame'} onClick={() => open('postFrame')}>
          {postFrame ? <ScaledPreview item={postFrame} className="rounded-none bg-transparent" /> : <span className="text-[var(--text-muted)]">—</span>}
        </PartTile>
        <PartTile label="Calendário" value={calendar?.name ?? 'Padrão'} active={part === 'calendarSkin'} onClick={() => open('calendarSkin')}>
          {calendar ? <ScaledPreview item={calendar} className="rounded-none bg-transparent" /> : <span className="text-[var(--text-muted)]">—</span>}
        </PartTile>
        <PartTile label="Ícone e sons" value={soundsOn ? 'Sons ligados' : 'Sem sons'} active={part === 'app'} onClick={() => open('app')}>
          <span className="flex items-center gap-1.5">
            <img src={iconSrc(profile?.appIconVariant ?? 'default')} alt="" className="h-9 w-9 rounded-xl" />
            {soundsOn ? <Volume2 size={18} className="text-[var(--accent)]" /> : <VolumeX size={18} className="text-[var(--text-muted)]" />}
          </span>
        </PartTile>
      </div>

      <AnimatePresence>
        {part && (
          <Sheet key={part} title={PART_TITLE[part]} onClose={() => setPart(null)}>
            {part === 'theme' && <OwnedGrid kind="theme" allowNone={false} />}
            {part === 'visual' && <VisualStylePicker />}
            {part === 'avatarFrame' && <OwnedGrid kind="avatarFrame" allowNone />}
            {part === 'postFrame' && <OwnedGrid kind="postFrame" allowNone />}
            {part === 'calendarSkin' && <OwnedGrid kind="calendarSkin" allowNone />}
            {part === 'app' && <AppOptions />}
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  )
}
