import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { Check, Compass, Home, MessageCircle, Coins } from 'lucide-react'
import PixelIcon from './PixelIcon'
import AuroraLogo from './AuroraLogo'
import { useIconStyle, type IconStyle } from './AppIcon'
import { playSound } from '../lib/sounds'

// Escolha do visual (Clean é o padrão, 8-bit é opcional) com uma telinha de demonstração de cada um.
// A demonstração desenha os dois lados fixos — não depende do visual que está ligado agora, senão
// as duas prévias ficariam iguais.

export function VisualPreview({ value, className }: { value: IconStyle; className?: string }) {
  const pixel = value === 'pixel'
  return (
    <div
      className={clsx('w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)] text-left', className)}
      style={pixel ? { fontFamily: "'Jersey 20', 'Nunito', sans-serif", fontSizeAdjust: 0.52, fontSynthesisWeight: 'none' } : undefined}
      aria-hidden
    >
      <div className="flex justify-center py-1.5">
        <AuroraLogo height={14} variant={value} />
      </div>
      <div className="mx-2 flex items-center justify-between rounded-lg bg-[var(--surface)] px-2 py-1.5">
        <span className={clsx('text-[11px] text-[var(--text)]', pixel ? 'font-bold' : 'font-extrabold')}>Rotinas</span>
        <span className="flex items-center gap-1">
          {pixel ? <PixelIcon name="coin" size={10} /> : <Coins size={11} className="text-amber-500" />}
          <span className="text-[10px] font-bold text-[var(--text)]">120</span>
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-around border-t border-[var(--border)] bg-[var(--surface)] py-1.5">
        {pixel ? (
          <>
            <PixelIcon name="homeColor" size={16} />
            <PixelIcon name="compass" size={16} />
            <PixelIcon name="chatColor" size={14} />
          </>
        ) : (
          <>
            <Home size={16} className="text-[var(--accent)]" />
            <Compass size={16} className="text-[var(--text-muted)]" />
            <MessageCircle size={16} className="text-[var(--text-muted)]" />
          </>
        )}
      </div>
    </div>
  )
}

export default function VisualStylePicker({ showHowToChange = true }: { showHowToChange?: boolean }) {
  const { t } = useTranslation()
  const style = useIconStyle((s) => s.style)
  const setStyle = useIconStyle((s) => s.setStyle)

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ['classic', 'Clean', t('visual.cleanHint')],
            ['pixel', '8-bit', t('visual.pixelHint')],
          ] as const
        ).map(([value, label, hint]) => {
          const selected = style === value
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                playSound('tap')
                setStyle(value)
              }}
              className={clsx(
                'relative flex flex-col gap-2 rounded-2xl border-2 p-2 text-left transition active:scale-[0.98]',
                selected ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)] bg-[var(--surface)]',
              )}
            >
              <VisualPreview value={value} />
              <span className="px-1 pb-0.5">
                <span className="block text-sm font-bold text-[var(--text)]">{label}</span>
                <span className="block text-xs text-[var(--text-muted)]">{hint}</span>
              </span>
              {selected && (
                <span className="absolute bottom-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
                  <Check size={12} />
                </span>
              )}
            </button>
          )
        })}
      </div>
      {showHowToChange && <p className="mt-2 text-xs text-[var(--text-muted)]">{t('visual.howToChange')}</p>}
    </div>
  )
}
