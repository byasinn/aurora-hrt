import clsx from 'clsx'
import type { CSSProperties } from 'react'
import Avatar from '../../components/Avatar'
import PixelIcon from '../../components/PixelIcon'
import { useProfile } from '../../api/profile'
import { CALENDAR_SKINS, CARD_SKINS, POST_FRAMES, THEMES } from '../../lib/shopVisuals'
import { SHOP_ITEM_BY_KEY, type ShopItem } from '../../../shared/shopCatalog'

// Miniaturas da vitrine da lojinha (e da escolha de tema em Aparência) — cada tipo de item mostra
// uma amostra de como fica de verdade.

function CardPreview({ itemKey }: { itemKey: string }) {
  const skin = CARD_SKINS[itemKey]
  return (
    <div
      className={clsx('flex h-full items-center px-3 text-sm font-semibold', skin.pixel ? 'pixel-frame m-[3px] !rounded-none' : 'rounded-2xl')}
      style={{ ...skin.style, color: skin.color, paddingLeft: skin.paddingLeft, ...(skin.pixel ? ({ '--pf': '#9c59d1' } as CSSProperties) : {}) }}
    >
      Oi, gente! ✨
    </div>
  )
}

function FramePreview({ itemKey }: { itemKey: string }) {
  const { data: profile } = useProfile()
  return (
    <div className="flex h-full items-center justify-center pt-2">
      <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} frame={itemKey} size={56} />
    </div>
  )
}

function PostFramePreview({ itemKey }: { itemKey: string }) {
  const frame = POST_FRAMES[itemKey]
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
  const ornament = frame.ornament && (
    <span className="absolute -right-1 -top-2">
      <PixelIcon name={frame.ornament.icon} size={18} palette={frame.ornament.palette} />
    </span>
  )
  return frame.pixel ? (
    <div className="pixel-frame relative m-1 h-[calc(100%-0.5rem)]" style={{ '--pf': frame.border, '--pf-size': '4px' } as CSSProperties}>
      {inner}
      {ornament}
    </div>
  ) : (
    <div className="relative h-full rounded-[17px] p-[3px]" style={{ background: frame.border, boxShadow: frame.glow }}>
      {inner}
      {ornament}
    </div>
  )
}

/** Amostra de tema: fundo no modo do tema + bolinhas das cores. */
export function ThemeSwatch({ itemKey, className }: { itemKey: string; className?: string }) {
  const theme = THEMES[itemKey]
  const dark = theme.mode === 'dark'
  const base = dark ? '#0e1015' : '#faf7f8'
  const background =
    theme.skin === 'galaxia' || theme.skin === 'nb'
      ? `radial-gradient(1px 1px at 20% 30%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 70% 20%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 45% 60%, #fde68a 50%, transparent 51%), linear-gradient(160deg, ${base}, ${theme.accent}40)`
      : theme.skin === 'retro'
        ? `linear-gradient(${theme.accent2}33 1px, transparent 1px) 0 0 / 10px 10px, linear-gradient(90deg, ${theme.accent2}33 1px, ${base} 1px) 0 0 / 10px 10px`
        : `linear-gradient(160deg, ${base}, ${theme.accent}${dark ? '40' : '30'})`
  return (
    <div className={clsx('flex items-end gap-1.5 rounded-2xl p-3', className)} style={{ background }}>
      {/* "cartão" no meio, pra ver o contraste do modo */}
      <span className="mr-auto flex flex-col gap-1 rounded-lg p-1.5" style={{ background: dark ? '#171a21' : '#ffffff' }}>
        <span className="block h-1.5 w-8 rounded-full" style={{ background: theme.accent }} />
        <span className="block h-1.5 w-5 rounded-full" style={{ background: dark ? '#2a2f3a' : '#eadfe6' }} />
      </span>
      {[theme.accent, theme.accent2, theme.accent3].map((c, i) => (
        <span key={i} className="h-5 w-5 rounded-full border-2 border-white/80" style={{ background: c }} />
      ))}
    </div>
  )
}

function CalendarPreview({ itemKey }: { itemKey: string }) {
  const cal = CALENDAR_SKINS[itemKey]
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

/** Pacote: moldura + card + amostra do tema, lado a lado. */
function BundlePreview({ item }: { item: ShopItem }) {
  const keys = item.items ?? []
  const of = (kind: ShopItem['kind']) => keys.find((k) => SHOP_ITEM_BY_KEY.get(k)?.kind === kind)
  const frame = of('avatarFrame')
  const card = of('cardSkin')
  const theme = of('theme')
  return (
    <div className="grid h-full grid-cols-[auto_1fr] gap-2">
      <div className="flex items-center justify-center px-1 pt-2">
        {frame && <FramePreview itemKey={frame} />}
      </div>
      <div className="grid grid-rows-2 gap-1.5">
        {card && <CardPreview itemKey={card} />}
        {theme && <ThemeSwatch itemKey={theme} className="!p-1.5" />}
      </div>
    </div>
  )
}

export default function ItemPreview({ item }: { item: ShopItem }) {
  switch (item.kind) {
    case 'bundle':
      return <BundlePreview item={item} />
    case 'cardSkin':
      return <CardPreview itemKey={item.key} />
    case 'avatarFrame':
      return <FramePreview itemKey={item.key} />
    case 'postFrame':
      return <PostFramePreview itemKey={item.key} />
    case 'theme':
      return <ThemeSwatch itemKey={item.key} className="h-full" />
    case 'calendarSkin':
      return <CalendarPreview itemKey={item.key} />
  }
}
