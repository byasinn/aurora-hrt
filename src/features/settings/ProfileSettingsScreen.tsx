import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { Button, Card } from '../../components/ui'
import { Check } from '../../components/icons'
import { useProfile, useUpdateProfile } from '../../api/profile'
import { ApiError } from '../../lib/apiClient'
import { toastError } from '../../lib/toast'
import { todayStr, daysBetween } from '../../lib/dateUtils'
import { PRONOUN_PRESETS, pronounPresetsFor } from '../../lib/pronouns'
import { TRANSITION_BONUS_MAX_YEARS, TRANSITION_BONUS_PER_YEAR, transitionYearsBonus } from '../../lib/collectiblesEngine'
import { GENDER_OPTIONS, MAX_CUSTOM_GENDER, customGender, genderLabel, isCustomGender } from '../../../shared/genders'
import SettingsSubHeader from './SettingsSubHeader'

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-[var(--text)] outline-none focus:border-[var(--accent)]'

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-xs font-bold text-[var(--text-muted)]">{children}</p>
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={clsx(
        'min-h-9 rounded-full border px-3 text-sm transition',
        selected ? 'border-[var(--accent)] bg-[var(--accent)] font-bold text-[var(--accent-contrast)]' : 'border-[var(--border)] text-[var(--text-muted)]',
      )}
    >
      {children}
    </button>
  )
}

function UsernameCard() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) setUsername(profile.username ?? '')
  }, [profile])

  async function handleSave() {
    setError(null)
    setSaved(false)
    const normalized = username.trim().toLowerCase()
    if (normalized === profile?.username) return
    try {
      await updateProfile.mutateAsync({ username: normalized })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar.')
    }
  }

  return (
    <Card className="space-y-2">
      <Label>Nome de usuário</Label>
      <div className="flex gap-2">
        <div className="flex flex-1 items-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3">
          <span className="text-[var(--text-muted)]">@</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            maxLength={20}
            className="w-full bg-transparent px-1 py-2.5 text-[var(--text)] outline-none"
          />
        </div>
        <Button onClick={handleSave} disabled={updateProfile.isPending || !username.trim() || username === profile?.username} className="shrink-0">
          {saved ? <Check size={16} /> : 'Salvar'}
        </Button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-xs text-[var(--text-muted)]">3-20 caracteres: letras minúsculas, números e _. Até 3 trocas por mês.</p>
    </Card>
  )
}

export default function ProfileSettingsScreen() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const { i18n } = useTranslation()
  const presets = pronounPresetsFor(i18n.resolvedLanguage).map((p) => p.value)

  const [displayName, setDisplayName] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [customPronouns, setCustomPronouns] = useState(false)
  const [gender, setGender] = useState<string | null>(null)
  const [customGenderText, setCustomGenderText] = useState('')
  const [transitionStartDate, setTransitionStartDate] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.displayName)
    setPronouns(profile.pronouns)
    setCustomPronouns(!!profile.pronouns && !PRONOUN_PRESETS.includes(profile.pronouns))
    setGender(profile.gender ?? null)
    setCustomGenderText(isCustomGender(profile.gender) ? (genderLabel(profile.gender) ?? '') : '')
    setTransitionStartDate(profile.transitionStartDate ?? '')
  }, [profile])

  const customSelected = gender === 'custom' || isCustomGender(gender)
  const days = transitionStartDate ? daysBetween(transitionStartDate, todayStr()) : null
  const bonus = transitionYearsBonus(days)

  async function save() {
    const genderValue = customSelected ? (customGenderText.trim() ? customGender(customGenderText) : null) : gender
    try {
      await updateProfile.mutateAsync({ displayName, pronouns, gender: genderValue, transitionStartDate: transitionStartDate || null })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      toastError(err, 'Não foi possível salvar.')
    }
  }

  return (
    <div className="space-y-4">
      <SettingsSubHeader title="Perfil" />

      <Card className="space-y-4">
        <div>
          <Label>Nome de exibição</Label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} />
          <p className="mt-1 text-xs text-[var(--text-muted)]">Até 3 trocas por mês.</p>
        </div>

        <div>
          <Label>Pronomes</Label>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Chip
                key={preset}
                selected={!customPronouns && pronouns === preset}
                onClick={() => {
                  setPronouns(preset)
                  setCustomPronouns(false)
                }}
              >
                {preset}
              </Chip>
            ))}
            <Chip
              selected={customPronouns}
              onClick={() => {
                setCustomPronouns(true)
                if (PRONOUN_PRESETS.includes(pronouns)) setPronouns('')
              }}
            >
              Outro
            </Chip>
          </div>
          {customPronouns && (
            <input autoFocus value={pronouns} onChange={(e) => setPronouns(e.target.value)} placeholder="Escreva seus pronomes…" className={clsx(inputClass, 'mt-2')} />
          )}
        </div>

        <div>
          <Label>Gênero</Label>
          <div className="flex flex-wrap gap-2">
            {GENDER_OPTIONS.map((g) => (
              <Chip key={g.key} selected={gender === g.key} onClick={() => setGender(gender === g.key ? null : g.key)}>
                {g.label}
              </Chip>
            ))}
            <Chip selected={customSelected} onClick={() => setGender(customSelected ? null : 'custom')}>
              Outro
            </Chip>
          </div>
          {customSelected && (
            <input
              autoFocus
              value={customGenderText}
              maxLength={MAX_CUSTOM_GENDER}
              onChange={(e) => setCustomGenderText(e.target.value)}
              placeholder="Como você descreve seu gênero?"
              className={clsx(inputClass, 'mt-2')}
            />
          )}
        </div>

        <div>
          <Label>Início da transição</Label>
          <input type="date" value={transitionStartDate} max={todayStr()} onChange={(e) => setTransitionStartDate(e.target.value)} className={inputClass} />
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            Não cria pontos de atividade pra trás — mas cada ano completo de transição vale +{TRANSITION_BONUS_PER_YEAR} de Brilho (até{' '}
            {TRANSITION_BONUS_MAX_YEARS} anos).
            {bonus > 0 && <strong className="text-[var(--accent)]"> Seu bônus agora: +{bonus} ✨</strong>}
          </p>
        </div>

        <Button className="w-full" onClick={save} disabled={updateProfile.isPending}>
          {saved ? 'Salvo!' : updateProfile.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </Card>

      <UsernameCard />
    </div>
  )
}
