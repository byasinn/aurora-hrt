import { Link } from 'react-router-dom'
import { Check, Store } from 'lucide-react'
import clsx from 'clsx'
import type { CSSProperties } from 'react'
import { useShop } from '../api/shop'
import { CARD_SKINS } from '../lib/shopVisuals'
import { SHOP_ITEMS, ownsItem } from '../../shared/shopCatalog'
import { playSound } from '../lib/sounds'

/** null = texto normal · 'theme' = card nas cores do tema · outra string = card da lojinha */
export type CardChoice = null | 'theme' | string

interface ThemeColors {
  accent: string
  accent2: string
}

/** Campos do post pra cada escolha — o servidor confere se a pessoa tem o card da lojinha. */
export function cardPayload(choice: CardChoice, theme: ThemeColors) {
  if (choice == null) return { cardStyle: false, cardColor: null, cardColor2: null, cardSkin: null }
  if (choice === 'theme') return { cardStyle: true, cardColor: theme.accent, cardColor2: theme.accent2, cardSkin: null }
  return { cardStyle: true, cardColor: null, cardColor2: null, cardSkin: choice }
}

/** Visual da caixa de texto enquanto escreve, pra ver como o post vai ficar. */
export function cardPreview(choice: CardChoice, theme: ThemeColors): { style?: CSSProperties; className: string } {
  if (choice == null) return { className: 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]' }
  if (choice === 'theme') {
    return {
      style: { background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` },
      className: 'text-white placeholder:text-white/70 border-transparent',
    }
  }
  const skin = CARD_SKINS[choice]
  return {
    style: { ...skin?.style, color: skin?.color, paddingLeft: skin?.paddingLeft },
    className: 'border-transparent placeholder:opacity-70',
  }
}

const CARD_ITEMS = SHOP_ITEMS.filter((i) => i.kind === 'cardSkin')

export default function CardSkinPicker({
  value,
  onChange,
  theme,
}: {
  value: CardChoice
  onChange: (choice: CardChoice) => void
  theme: ThemeColors
}) {
  const { data: shop } = useShop()
  const owned = CARD_ITEMS.filter((i) => ownsItem(shop?.owned ?? [], i.key))

  const options: { key: CardChoice; label: string; style: CSSProperties }[] = [
    { key: null, label: 'Sem card', style: { background: 'var(--surface-2)' } },
    { key: 'theme', label: 'Meu tema', style: { background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` } },
    ...owned.map((i) => ({ key: i.key as CardChoice, label: i.name, style: CARD_SKINS[i.key]?.style ?? {} })),
  ]

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {options.map((opt) => {
        const selected = value === opt.key
        return (
          <button
            key={opt.key ?? 'none'}
            type="button"
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={selected}
            onClick={() => {
              playSound('tap')
              onChange(opt.key)
            }}
            className={clsx(
              'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 transition',
              selected ? 'border-[var(--accent)] scale-105' : 'border-[var(--border)]',
            )}
            style={opt.style}
          >
            {selected && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
                <Check size={12} />
              </span>
            )}
          </button>
        )
      })}
      <Link
        to="/loja"
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-2xl border-2 border-dashed border-[var(--border)] px-3 text-sm font-bold text-[var(--text-muted)]"
      >
        <Store size={16} /> Mais cards
      </Link>
    </div>
  )
}
