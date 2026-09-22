import { useEffect, useState } from 'react'
import { Button, Card } from '../../components/ui'
import Switch from '../../components/Switch'
import { useProfile, useUpdateProfile } from '../../api/profile'
import { todayStr } from '../../lib/dateUtils'
import { PRONOUN_PRESETS } from '../../lib/pronouns'
import SettingsSubHeader from './SettingsSubHeader'

const CONTENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'feminine', label: 'Feminino' },
  { value: 'masculine', label: 'Masculino' },
  { value: 'combined', label: 'Combinado' },
]

export default function ProfileSettingsScreen() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()

  const [displayName, setDisplayName] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [customPronouns, setCustomPronouns] = useState(false)
  const [transitionStartDate, setTransitionStartDate] = useState('')

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.displayName)
    setPronouns(profile.pronouns)
    setCustomPronouns(!!profile.pronouns && !PRONOUN_PRESETS.includes(profile.pronouns))
    setTransitionStartDate(profile.transitionStartDate ?? '')
  }, [profile])

  function savePreferences() {
    updateProfile.mutate({ displayName, pronouns, transitionStartDate: transitionStartDate || null })
  }

  return (
    <div className="space-y-4">
      <SettingsSubHeader title="Perfil e preferências" />

      <Card className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Nome</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Pronomes</label>
          <div className="flex flex-wrap gap-2">
            {PRONOUN_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setPronouns(preset)
                  setCustomPronouns(false)
                }}
                className={
                  'rounded-full border px-3 py-1.5 text-sm transition ' +
                  (!customPronouns && pronouns === preset
                    ? 'border-[var(--accent)] bg-[var(--surface-2)] text-[var(--text)]'
                    : 'border-[var(--border)] text-[var(--text-muted)]')
                }
              >
                {preset}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setCustomPronouns(true)
                if (PRONOUN_PRESETS.includes(pronouns)) setPronouns('')
              }}
              className={
                'rounded-full border px-3 py-1.5 text-sm transition ' +
                (customPronouns
                  ? 'border-[var(--accent)] bg-[var(--surface-2)] text-[var(--text)]'
                  : 'border-[var(--border)] text-[var(--text-muted)]')
              }
            >
              Outro
            </button>
          </div>
          {customPronouns && (
            <input
              autoFocus
              value={pronouns}
              onChange={(e) => setPronouns(e.target.value)}
              placeholder="Escreva seus pronomes…"
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Início da transição</label>
          <input
            type="date"
            value={transitionStartDate}
            max={todayStr()}
            onChange={(e) => setTransitionStartDate(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <p className="mb-2 text-xs text-[var(--text-muted)]">Conteúdo de medidas</p>
          <div className="flex gap-2">
            {CONTENT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={profile?.contentPreference === opt.value ? 'primary' : 'secondary'}
                className="flex-1"
                onClick={() => updateProfile.mutate({ contentPreference: opt.value })}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <Button className="w-full" onClick={savePreferences} disabled={updateProfile.isPending}>
          Salvar
        </Button>
      </Card>

      <Card className="space-y-2">
        <div className="flex items-center justify-between gap-3 py-1">
          <span className="min-w-0 flex-1 text-sm text-[var(--text)]">Mostrar dica do dia na Home</span>
          <Switch
            checked={profile?.showTipsOnHome ?? true}
            onChange={(v) => updateProfile.mutate({ showTipsOnHome: v })}
          />
        </div>
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--text)]">Treinos</p>
            <p className="text-xs text-[var(--text-muted)]">Ativa o botão de Treinos no Meu espaço e na Home.</p>
          </div>
          <Switch checked={profile?.workoutsEnabled ?? false} onChange={(v) => updateProfile.mutate({ workoutsEnabled: v })} />
        </div>
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--text)]">Ciclo menstrual</p>
            <p className="text-xs text-[var(--text-muted)]">
              Acompanhamento opcional de período, sintomas e previsões, direto no Histórico.
            </p>
          </div>
          <Switch
            checked={profile?.cycleTrackingEnabled ?? false}
            onChange={(v) => updateProfile.mutate({ cycleTrackingEnabled: v })}
          />
        </div>
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--text)]">Atividade íntima</p>
            <p className="text-xs text-[var(--text-muted)]">
              Registro privado de atividade sexual por dia, direto no Histórico. Independente do ciclo.
            </p>
          </div>
          <Switch
            checked={profile?.intimateTrackingEnabled ?? false}
            onChange={(v) => updateProfile.mutate({ intimateTrackingEnabled: v })}
          />
        </div>
      </Card>
    </div>
  )
}
