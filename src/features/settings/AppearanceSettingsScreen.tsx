import { Link } from 'react-router-dom'
import { Check, ChevronRight, Smartphone } from 'lucide-react'
import { Card, Button } from '../../components/ui'
import { useThemeStore, applyTheme, COLOR_SHORTCUTS } from '../../lib/themeStore'
import { useProfile, useUpdateProfile } from '../../api/profile'
import SettingsSubHeader from './SettingsSubHeader'

const ICON_VARIANTS = [
  { key: 'default', label: 'Rosa & Azul' },
  { key: 'dourado', label: 'Dourado & Lavanda' },
  { key: 'esmeralda', label: 'Esmeralda & Rosa' },
  { key: 'turquesa', label: 'Turquesa & Areia' },
  { key: 'lilas', label: 'Lilás & Menta' },
]

export default function AppearanceSettingsScreen() {
  const theme = useThemeStore()
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()

  return (
    <div className="space-y-4">
      <SettingsSubHeader title="Aparência" />

      <Card className="space-y-4">
        <div>
          <p className="mb-2 text-xs text-[var(--text-muted)]">Modo</p>
          <div className="flex gap-2">
            <Button
              variant={theme.mode === 'light' ? 'primary' : 'secondary'}
              className="flex-1"
              onClick={() => {
                theme.setMode('light')
                applyTheme('light', theme.accent, theme.accent2)
              }}
            >
              Claro
            </Button>
            <Button
              variant={theme.mode === 'dark' ? 'primary' : 'secondary'}
              className="flex-1"
              onClick={() => {
                theme.setMode('dark')
                applyTheme('dark', theme.accent, theme.accent2)
              }}
            >
              Escuro
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-[var(--text-muted)]">Atalhos de cor</p>
          <div className="flex flex-wrap gap-2">
            {COLOR_SHORTCUTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  theme.setAccent(s.accent, s.accent2)
                  applyTheme(theme.mode, s.accent, s.accent2)
                }}
                className="h-9 w-9 rounded-full border-2 border-[var(--border)] transition hover:scale-110"
                style={{ background: `linear-gradient(135deg, ${s.accent}, ${s.accent2})` }}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-[var(--text-muted)]">Cores livres</p>
          <div className="flex gap-4">
            <label className="flex flex-1 flex-col items-center gap-1 text-xs text-[var(--text-muted)]">
              Principal
              <input
                type="color"
                value={theme.accent}
                onChange={(e) => {
                  theme.setAccent(e.target.value, theme.accent2)
                  applyTheme(theme.mode, e.target.value, theme.accent2)
                }}
                className="h-10 w-full cursor-pointer rounded-lg border border-[var(--border)] bg-transparent"
              />
            </label>
            <label className="flex flex-1 flex-col items-center gap-1 text-xs text-[var(--text-muted)]">
              Secundária
              <input
                type="color"
                value={theme.accent2}
                onChange={(e) => {
                  theme.setAccent(theme.accent, e.target.value)
                  applyTheme(theme.mode, theme.accent, e.target.value)
                }}
                className="h-10 w-full cursor-pointer rounded-lg border border-[var(--border)] bg-transparent"
              />
            </label>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-[var(--text-muted)]">Títulos e marcações</p>
          <div className="flex gap-4">
            <label className="flex flex-1 flex-col items-center gap-1 text-xs text-[var(--text-muted)]">
              Aura (títulos especiais)
              <input
                type="color"
                value={theme.accent3}
                onChange={(e) => {
                  theme.setAccent3(e.target.value)
                  applyTheme(theme.mode, theme.accent, theme.accent2, e.target.value)
                }}
                className="h-10 w-full cursor-pointer rounded-lg border border-[var(--border)] bg-transparent"
              />
            </label>
          </div>
        </div>
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
