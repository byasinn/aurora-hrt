import { Link } from 'react-router-dom'
import { Smartphone, Volume2 } from 'lucide-react'
import { Check, ChevronRight, Home, MessageCircle, Store, User } from '../../components/icons'
import PixelIcon from '../../components/PixelIcon'
import { useIconStyle } from '../../components/AppIcon'
import clsx from 'clsx'
import { Card } from '../../components/ui'
import { useThemeStore } from '../../lib/themeStore'
import { useShop, useEquipItem } from '../../api/shop'
import { toastError } from '../../lib/toast'
import { ThemeSwatch } from '../shop/ItemPreview'
import { DEFAULT_THEME, SHOP_ITEMS, ownsItem } from '../../../shared/shopCatalog'
import { useProfile, useUpdateProfile } from '../../api/profile'
import SettingsSubHeader from './SettingsSubHeader'
import Switch from '../../components/Switch'
import { playSound, useSoundStore } from '../../lib/sounds'

const ICON_VARIANTS = [
  { key: 'default', label: 'Rosa & Azul' },
  { key: 'dourado', label: 'Dourado & Lavanda' },
  { key: 'esmeralda', label: 'Esmeralda & Rosa' },
  { key: 'turquesa', label: 'Turquesa & Areia' },
  { key: 'lilas', label: 'Lilás & Menta' },
]

export default function AppearanceSettingsScreen() {
  const mode = useThemeStore((t) => t.mode)
  const { data: profile } = useProfile()
  const { data: shop } = useShop()
  const equip = useEquipItem()
  // os 4 temas base são grátis; o resto aparece aqui depois de comprado na Lojinha
  const themes = SHOP_ITEMS.filter((i) => i.kind === 'theme' && ownsItem(shop?.owned ?? [], i.key))
  const currentTheme = profile?.equippedTheme ?? DEFAULT_THEME[mode]
  const updateProfile = useUpdateProfile()
  const sounds = useSoundStore()
  const iconStyle = useIconStyle()

  return (
    <div className="space-y-4">
      <SettingsSubHeader title="Aparência" />

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-bold text-[var(--text)]">Tema</p>
          <Link to="/loja" className="flex items-center gap-1 text-sm font-bold text-[var(--accent)]">
            <Store size={15} /> Mais temas na Lojinha
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {themes.map((item) => {
            const selected = currentTheme === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  if (selected) return
                  playSound('success')
                  equip.mutate({ kind: 'theme', itemKey: item.key }, { onError: (err) => toastError(err, 'Não deu pra trocar o tema agora.') })
                }}
                className={clsx(
                  'overflow-hidden rounded-2xl border-2 text-left transition',
                  selected ? 'border-[var(--accent)]' : 'border-[var(--border)]',
                )}
              >
                <ThemeSwatch itemKey={item.key} className="h-16 rounded-none" />
                <span className="flex items-center justify-between gap-1 px-2.5 py-2 text-sm font-bold text-[var(--text)]">
                  {item.name}
                  {selected && <Check size={15} className="shrink-0 text-[var(--accent)]" />}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="space-y-3">
        <div>
          <p className="font-bold text-[var(--text)]">Visual</p>
          <p className="text-xs text-[var(--text-muted)]">8-bit tem ícones e detalhes em pixel art; Clean é tudo como era antes</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['pixel', '8-bit'],
              ['classic', 'Clean'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={iconStyle.style === value}
              onClick={() => {
                playSound('tap')
                iconStyle.setStyle(value)
              }}
              className={clsx(
                'flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 text-sm font-bold transition',
                iconStyle.style === value ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)]',
              )}
            >
              <span className="flex items-center gap-2 text-[var(--accent)]">
                {value === 'pixel' ? (
                  <>
                    <PixelIcon name="home" size={20} />
                    <PixelIcon name="chat" size={20} />
                    <PixelIcon name="user" size={20} />
                  </>
                ) : (
                  <>
                    <Home size={22} />
                    <MessageCircle size={22} />
                    <User size={22} />
                  </>
                )}
              </span>
              <span className="text-[var(--text)]">{label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <Volume2 size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-[var(--text)]">Sons</span>
          <span className="block text-xs text-[var(--text-muted)]">Barulhinhos ao tomar dose, curtir e navegar</span>
        </span>
        <Switch
          checked={sounds.enabled}
          onChange={(on) => {
            sounds.setEnabled(on)
            // toca depois de ligar, pra pessoa ouvir como é
            if (on) setTimeout(() => playSound('success'), 80)
          }}
        />
      </Card>

      <Card className="space-y-2">
        <p className="text-sm font-medium text-[var(--text)]">Ícone do app</p>
        <p className="text-xs text-[var(--text-muted)]">
          Escolha a cor do ícone que aparece na tela de início. Depois de trocar, remova o app da tela de início e
          adicione de novo pra ver a cor nova — o sistema não atualiza sozinho um ícone já instalado.
        </p>
        <div className="flex flex-wrap gap-3">
          {ICON_VARIANTS.map((v) => {
            const selected = (profile?.appIconVariant ?? 'default') === v.key
            const iconSrc = v.key === 'default' ? '/icons/icon-192.png' : `/icons/variants/${v.key}/icon-192.png`
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => updateProfile.mutate({ appIconVariant: v.key })}
                className="flex flex-col items-center gap-1"
                title={v.label}
              >
                <span className="relative">
                  <img src={iconSrc} alt={v.label} className="h-12 w-12 rounded-xl border border-[var(--border)]" />
                  {selected && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
                      <Check size={10} />
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <Link to="/settings/instalar">
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
            <Smartphone size={18} />
          </span>
          <span className="flex-1 font-medium text-[var(--text)]">Instalar o app</span>
          <ChevronRight size={18} className="text-[var(--text-muted)]" />
        </Card>
      </Link>
    </div>
  )
}
