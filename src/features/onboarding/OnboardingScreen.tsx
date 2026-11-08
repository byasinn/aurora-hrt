import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AuroraLogo from '../../components/AuroraLogo'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { BellRing, CircleHelp, Flower2, type LucideIcon } from 'lucide-react'
import { Bell, Calendar, Camera, Check, Droplet, Dumbbell, Heart, MessageCircle, Pill, Ruler, Sparkles, Store, Users } from '../../components/icons'
import { Button } from '../../components/ui'
import Avatar from '../../components/Avatar'
import PixelIcon from '../../components/PixelIcon'
import VisualStylePicker from '../../components/VisualStylePicker'
import { markVisualIntroSeen } from '../../components/VisualIntroModal'
import ImageCropper from '../../components/ImageCropper'
import { useUpdateProfile } from '../../api/profile'
import { useEquipItem } from '../../api/shop'
import MedicationForm from '../medications/MedicationForm'
import { useMedications } from '../../api/medications'
import { PRONOUN_PRESETS, pronounPresetsFor } from '../../lib/pronouns'
import { enablePushNotifications } from '../../lib/notifications'
import { playSound } from '../../lib/sounds'
import { useThemeStore } from '../../lib/themeStore'
import { ThemeSwatch } from '../shop/ItemPreview'
import { THEMES } from '../../lib/shopVisuals'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../../i18n'
import { DEFAULT_THEME, SHOP_ITEMS } from '../../../shared/shopCatalog'
import type { TextStyle, ContentPreference, AppModule } from '../../../shared/types'

// Sete passos curtos em vez de onze telas de uma pergunta só: perguntas que andam juntas ficam na
// mesma tela, e o que faz o app servir desde o primeiro dia (lembrete de dose, tema, primeiros
// passos) entra no caminho em vez de ficar escondido em Configurações.
const STEPS = ['welcome', 'you', 'journey', 'medication', 'modules', 'look', 'visual', 'done'] as const
type Step = (typeof STEPS)[number]

type HrtAnswer = 'yes' | 'planning' | 'unsure'
type ModuleKey = AppModule | 'workouts' | 'cycle' | 'intimate'

const AVATAR_ICONS = ['🦋', '🌸', '✨', '🌈', '💫', '🐱', '🦄', '💖', '🍑', '🧁', '🌙', '🌻']
const FREE_THEMES = SHOP_ITEMS.filter((i) => i.kind === 'theme' && i.price === 0)

/** Cartão de escolha grande, com ícone — o mesmo pra uma escolha só ou várias. */
function ChoiceCard({
  selected,
  onClick,
  icon: Icon,
  label,
  hint,
  compact,
}: {
  selected: boolean
  onClick: () => void
  icon?: LucideIcon
  label: string
  hint?: string
  compact?: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => {
        playSound('tap')
        onClick()
      }}
      className={clsx(
        'relative flex w-full items-center gap-3 rounded-2xl border-2 text-left transition active:scale-[0.98]',
        compact ? 'flex-col items-start gap-2 p-3' : 'min-h-14 px-4 py-3',
        selected ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/60',
      )}
    >
      {Icon && (
        <span
          className={clsx(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            selected ? 'bg-[var(--accent)] text-[var(--accent-contrast)]' : 'bg-[var(--surface-2)] text-[var(--accent)]',
          )}
        >
          <Icon size={20} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-[var(--text)]">{label}</span>
        {hint && <span className="block text-xs text-[var(--text-muted)]">{hint}</span>}
      </span>
      {selected && (
        <span className={clsx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]', compact && 'absolute right-2.5 top-2.5')}>
          <Check size={14} />
        </span>
      )}
    </button>
  )
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => {
        playSound('tap')
        onClick()
      }}
      className={clsx(
        'min-h-10 rounded-full border-2 px-4 text-sm font-bold transition active:scale-95',
        selected ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)]',
      )}
    >
      {children}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{children}</p>
}

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text)]">{title}</h2>
      {subtitle && <p className="mt-1 text-[15px] text-[var(--text-muted)]">{subtitle}</p>}
    </div>
  )
}

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { t, i18n } = useTranslation()
  const updateProfile = useUpdateProfile()
  const equip = useEquipItem()
  const { data: medications } = useMedications()
  const mode = useThemeStore((s) => s.mode)
  const [stepIndex, setStepIndex] = useState(0)
  const step: Step = STEPS[stepIndex]

  const [displayName, setDisplayName] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [customPronouns, setCustomPronouns] = useState(false)
  const [textStyle, setTextStyle] = useState<TextStyle>('feminine')
  const [contentPreference, setContentPreference] = useState<ContentPreference | null>(null)
  const [hrt, setHrt] = useState<HrtAnswer | null>(null)
  const [showMedForm, setShowMedForm] = useState(false)
  const [notOnMedsYet, setNotOnMedsYet] = useState(false)
  const [reminders, setReminders] = useState<'idle' | 'working' | 'on' | 'failed'>('idle')
  const [reminderError, setReminderError] = useState<string | null>(null)
  const [modules, setModules] = useState<ModuleKey[]>(['medications', 'mood', 'calendar'])
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarIcon, setAvatarIcon] = useState<string | null>(null)
  const [croppingAvatar, setCroppingAvatar] = useState<File | null>(null)
  const [theme, setTheme] = useState<string>(DEFAULT_THEME[mode])
  const [useFrame, setUseFrame] = useState(true)
  const [saving, setSaving] = useState(false)

  const presets = pronounPresetsFor(i18n.resolvedLanguage)
  const hasMeds = (medications?.length ?? 0) > 0

  function go(delta: number) {
    playSound(delta > 0 ? 'pop' : 'tap')
    setStepIndex((i) => Math.min(Math.max(i + delta, 0), STEPS.length - 1))
  }

  // prévia ao vivo: o app já muda de cor ao tocar no tema (os temas grátis não têm fundo especial)
  function previewTheme(key: string) {
    setTheme(key)
    const visual = THEMES[key]
    const store = useThemeStore.getState()
    store.setMode(visual.mode)
    store.setAccent(visual.accent, visual.accent2)
    store.setAccent3(visual.accent3)
  }

  function toggleModule(m: ModuleKey) {
    setModules((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]))
  }

  async function turnOnReminders() {
    setReminders('working')
    const result = await enablePushNotifications()
    if (result.ok) {
      playSound('success')
      setReminders('on')
    } else {
      setReminders('failed')
      setReminderError(result.reason ?? null)
    }
  }

  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setCroppingAvatar(file)
    e.target.value = ''
  }

  async function finish() {
    setSaving(true)
    try {
      const goals = modules.filter((m): m is AppModule => ['medications', 'mood', 'calendar', 'measurements'].includes(m))
      await updateProfile.mutateAsync({
        displayName: displayName.trim(),
        pronouns: pronouns.trim(),
        textStyle,
        contentPreference: contentPreference ?? 'combined',
        isOnHrt: hrt == null ? null : hrt === 'yes',
        notOnMedsYet,
        appGoals: goals,
        enabledModules: goals,
        workoutsEnabled: modules.includes('workouts'),
        cycleTrackingEnabled: modules.includes('cycle'),
        intimateTrackingEnabled: modules.includes('intimate'),
        avatarUrl,
        avatarIcon,
        onboardingCompleted: true,
      })
      // tema e moldura passam pela lojinha (o perfil não aceita equipar direto); se falhar, a pessoa
      // só fica com o tema base — não trava a entrada no app
      await Promise.allSettled([
        equip.mutateAsync({ kind: 'theme', itemKey: theme }),
        useFrame ? equip.mutateAsync({ kind: 'avatarFrame', itemKey: 'frame-brilho' }) : Promise.resolve(),
      ])
      playSound('success')
      markVisualIntroSeen() // quem já escolheu o visual aqui não precisa do aviso "chegou o 8-bit"
      onComplete()
    } finally {
      setSaving(false)
    }
  }

  const canContinue: Record<Step, boolean> = {
    welcome: true,
    you: displayName.trim().length > 0 && pronouns.trim().length > 0,
    journey: contentPreference != null && hrt != null,
    medication: true,
    modules: true,
    look: true,
    visual: true,
    done: true,
  }

  const progressSteps = STEPS.length - 2 // sem boas-vindas e fim

  return (
    <div className="mx-auto flex min-h-app w-full max-w-lg flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] text-[var(--text)]">
      {step !== 'welcome' && step !== 'done' && (
        <div className="mb-6 flex gap-1.5" aria-label={`${stepIndex}/${progressSteps}`}>
          {Array.from({ length: progressSteps }).map((_, i) => (
            <div key={i} className={clsx('h-1.5 flex-1 rounded-full transition-colors', i < stepIndex ? 'flag-gradient' : 'bg-[var(--border)]')} />
          ))}
        </div>
      )}

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {step === 'welcome' && (
              <div className="flex min-h-[80svh] flex-col justify-center text-center">
                <div className="mx-auto mb-4 flex items-end gap-2">
                  <PixelIcon name="sparkle" size={28} />
                  <PixelIcon name="heart" size={40} palette={{ a: '#f5a9b8' }} />
                  <PixelIcon name="sparkle" size={22} palette={{ a: '#5bcefa', b: '#f5a9b8' }} />
                </div>
                <h1 className="flex justify-center">
                  <AuroraLogo height={40} />
                </h1>
                <h1 className="mt-3 text-2xl font-extrabold">{t('onboarding.welcome.title')}</h1>
                <p className="mt-1 text-[15px] text-[var(--text-muted)]">{t('onboarding.welcome.subtitle')}</p>

                <div className="mt-6 space-y-2 text-left">
                  {(
                    [
                      [BellRing, 'f1'],
                      [Users, 'f2'],
                      [Sparkles, 'f3'],
                    ] as const
                  ).map(([Icon, key]) => (
                    <div key={key} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                        <Icon size={20} />
                      </span>
                      <span>
                        <span className="block font-bold">{t(`onboarding.welcome.${key}Title`)}</span>
                        <span className="block text-sm text-[var(--text-muted)]">{t(`onboarding.welcome.${key}`)}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <Chip key={l.code} selected={i18n.resolvedLanguage === l.code} onClick={() => i18n.changeLanguage(l.code as LanguageCode)}>
                      {l.label}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {step === 'you' && (
              <div>
                <StepTitle title={t('onboarding.you.title')} subtitle={t('onboarding.you.nameHint')} />
                <input
                  autoFocus
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('onboarding.you.namePlaceholder')}
                  maxLength={50}
                  className="min-h-13 w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--surface)] px-4 text-lg font-semibold outline-none focus:border-[var(--accent)]"
                />

                <SectionLabel>{t('onboarding.you.pronounsTitle')}</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <Chip
                      key={p.value}
                      selected={!customPronouns && pronouns === p.value}
                      onClick={() => {
                        setCustomPronouns(false)
                        setPronouns(p.value)
                        setTextStyle(p.style)
                      }}
                    >
                      {p.value}
                    </Chip>
                  ))}
                  <Chip
                    selected={customPronouns}
                    onClick={() => {
                      setCustomPronouns(true)
                      if (PRONOUN_PRESETS.includes(pronouns)) setPronouns('')
                    }}
                  >
                    {t('onboarding.you.other')}
                  </Chip>
                </div>
                {customPronouns && (
                  <input
                    autoFocus
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    placeholder={t('onboarding.you.otherPlaceholder')}
                    maxLength={40}
                    className="mt-2 min-h-12 w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--surface)] px-4 outline-none focus:border-[var(--accent)]"
                  />
                )}

                <SectionLabel>{t('onboarding.you.styleTitle')}</SectionLabel>
                <div className="grid grid-cols-3 gap-2">
                  {(['feminine', 'masculine', 'neutral'] as const).map((s) => {
                    const example = t(`onboarding.you.ex${s[0].toUpperCase()}${s.slice(1)}`)
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={textStyle === s}
                        onClick={() => {
                          playSound('tap')
                          setTextStyle(s)
                        }}
                        className={clsx(
                          'min-h-16 rounded-2xl border-2 px-2 py-2 text-center transition active:scale-95',
                          textStyle === s ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)] bg-[var(--surface)]',
                        )}
                      >
                        <span className="block font-bold">{t(`onboarding.you.${s}`)}</span>
                        {example && <span className="block text-xs text-[var(--text-muted)]">“{example}”</span>}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">{t('onboarding.you.example', { word: t(`onboarding.you.ex${textStyle[0].toUpperCase()}${textStyle.slice(1)}`) })}</p>
              </div>
            )}

            {step === 'journey' && (
              <div>
                <StepTitle title={t('onboarding.journey.title')} subtitle={t('onboarding.journey.subtitle')} />
                <SectionLabel>{t('onboarding.journey.identityTitle')}</SectionLabel>
                <div className="space-y-2">
                  {(['feminine', 'masculine', 'combined'] as const).map((v) => (
                    <ChoiceCard key={v} selected={contentPreference === v} onClick={() => setContentPreference(v)} label={t(`onboarding.journey.${v}`)} />
                  ))}
                </div>

                <SectionLabel>{t('onboarding.journey.hrtTitle')}</SectionLabel>
                <div className="space-y-2">
                  <ChoiceCard selected={hrt === 'yes'} onClick={() => setHrt('yes')} icon={Pill} label={t('onboarding.journey.yes')} />
                  <ChoiceCard selected={hrt === 'planning'} onClick={() => setHrt('planning')} icon={Sparkles} label={t('onboarding.journey.planning')} />
                  <ChoiceCard selected={hrt === 'unsure'} onClick={() => setHrt('unsure')} icon={CircleHelp} label={t('onboarding.journey.unsure')} />
                </div>
                <p className="mt-4 rounded-2xl bg-[var(--surface-2)] p-3 text-xs text-[var(--text-muted)]">{t('onboarding.journey.disclaimer')}</p>
              </div>
            )}

            {step === 'medication' && (
              <div>
                <StepTitle
                  title={hrt === 'yes' ? t('onboarding.medication.titleOnHrt') : t('onboarding.medication.titlePlanning')}
                  subtitle={t('onboarding.medication.subtitle')}
                />

                {hasMeds && (
                  <div className="mb-3 space-y-2">
                    {medications!.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 rounded-2xl border-2 border-[var(--accent)] bg-[var(--surface)] p-3">
                        <PixelIcon name="pill" size={14} />
                        <span className="font-bold">{m.name}</span>
                        <span className="text-sm text-[var(--text-muted)]">
                          {m.doseAmount}
                          {m.doseUnit}
                        </span>
                        <Check size={18} className="ml-auto text-[var(--accent)]" />
                      </div>
                    ))}
                  </div>
                )}

                {showMedForm ? (
                  <MedicationForm onDone={() => setShowMedForm(false)} />
                ) : (
                  <div className="space-y-2">
                    <ChoiceCard
                      selected={false}
                      onClick={() => setShowMedForm(true)}
                      icon={Pill}
                      label={hasMeds ? t('onboarding.medication.addAnother') : t('onboarding.medication.add')}
                    />
                    {!hasMeds && (
                      <ChoiceCard
                        selected={notOnMedsYet}
                        onClick={() => setNotOnMedsYet((v) => !v)}
                        label={t('onboarding.medication.notYet')}
                      />
                    )}
                  </div>
                )}

                {hasMeds && !showMedForm && (
                  <div className="mt-5 rounded-3xl border-2 border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                        <Bell size={22} />
                      </span>
                      <div>
                        <p className="font-extrabold">{t('onboarding.medication.remindersTitle')}</p>
                        <p className="text-sm text-[var(--text-muted)]">{t('onboarding.medication.remindersBody')}</p>
                      </div>
                    </div>
                    {reminders === 'on' ? (
                      <p className="mt-3 flex min-h-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] font-bold">
                        {t('onboarding.medication.remindersOn')}
                      </p>
                    ) : (
                      <Button className="mt-3 w-full" onClick={turnOnReminders} disabled={reminders === 'working'}>
                        <BellRing size={18} /> {t('onboarding.medication.remindersCta')}
                      </Button>
                    )}
                    {reminders === 'failed' && (
                      <p className="mt-2 text-xs text-[var(--text-muted)]">{reminderError ?? t('onboarding.medication.remindersFail')}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 'modules' && (
              <div>
                <StepTitle title={t('onboarding.modules.title')} subtitle={t('onboarding.modules.subtitle')} />
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['medications', Pill],
                      ['mood', Heart],
                      ['calendar', Calendar],
                      ['measurements', Ruler],
                      ['workouts', Dumbbell],
                      ['cycle', Droplet],
                      ['intimate', Flower2],
                    ] as const
                  ).map(([key, Icon]) => (
                    <ChoiceCard
                      key={key}
                      compact
                      selected={modules.includes(key)}
                      onClick={() => toggleModule(key)}
                      icon={Icon}
                      label={t(`onboarding.modules.${key}`)}
                      hint={t(`onboarding.modules.${key}Hint`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 'look' && (
              <div>
                <StepTitle title={t('onboarding.look.title')} subtitle={t('onboarding.look.subtitle')} />
                <div className="flex items-center gap-4">
                  <div className="shrink-0 p-2">
                    <Avatar src={avatarUrl} icon={avatarIcon} name={displayName} frame={useFrame ? 'frame-brilho' : null} size={84} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="block">
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                      <span className="btn-press-soft flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm font-bold">
                        <Camera size={16} /> {t('onboarding.look.upload')}
                      </span>
                    </label>
                    <div className="mt-2 grid grid-cols-6 gap-1.5">
                      {AVATAR_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => {
                            playSound('tap')
                            setAvatarIcon(icon)
                            setAvatarUrl(null)
                          }}
                          className={clsx(
                            'flex aspect-square items-center justify-center rounded-xl border-2 text-lg transition active:scale-90',
                            avatarIcon === icon ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)]',
                          )}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <ChoiceCard
                    selected={useFrame}
                    onClick={() => setUseFrame((v) => !v)}
                    icon={Sparkles}
                    label={t('onboarding.look.frame')}
                    hint={t('onboarding.look.frameHint')}
                  />
                </div>

                <SectionLabel>{t('onboarding.look.themeTitle')}</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  {FREE_THEMES.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      aria-pressed={theme === item.key}
                      onClick={() => {
                        playSound('tap')
                        previewTheme(item.key)
                      }}
                      className={clsx(
                        'overflow-hidden rounded-2xl border-2 text-left transition active:scale-[0.98]',
                        theme === item.key ? 'border-[var(--accent)]' : 'border-[var(--border)]',
                      )}
                    >
                      <ThemeSwatch itemKey={item.key} className="h-14 rounded-none" />
                      <span className="flex items-center justify-between px-3 py-2 text-sm font-bold">
                        {item.name}
                        {theme === item.key && <Check size={15} className="text-[var(--accent)]" />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'visual' && (
              <div>
                <StepTitle title={t('visual.title')} subtitle={t('visual.subtitle')} />
                <VisualStylePicker />
              </div>
            )}

            {step === 'done' && (
              <div className="flex min-h-[80svh] flex-col justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 inline-block p-2">
                    <Avatar src={avatarUrl} icon={avatarIcon} name={displayName} frame={useFrame ? 'frame-brilho' : null} size={88} />
                  </div>
                  {/* "Tudo pronto" concorda com "tudo" (masculino fixo em português), não com a pessoa —
                      não é o pronto/a/e de gênero do sujeito, então não flexiona por textStyle. */}
                  <h1 className="text-2xl font-extrabold">
                    {t('onboarding.done.ready')}
                    {displayName.trim() ? `, ${displayName.trim()}` : ''}!
                  </h1>
                  <p className="mt-1 text-[var(--text-muted)]">{t('onboarding.done.subtitle')}</p>
                </div>
                <div className="mt-5 space-y-2">
                  {(
                    [
                      hasMeds && [Pill, 'stepDose'],
                      modules.includes('mood') && [Heart, 'stepMood'],
                      [MessageCircle, 'stepCommunity'],
                      [Store, 'stepShop'],
                    ].filter(Boolean) as [LucideIcon, string][]
                  ).map(([Icon, key], i) => (
                    <div key={key} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                      <span className="font-pixel flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-sm font-bold text-[var(--text)]">
                        {i + 1}
                      </span>
                      <span className="flex-1 font-semibold">{t(`onboarding.done.${key}`)}</span>
                      <Icon size={18} className="text-[var(--accent)]" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* barra de ação fixa embaixo: botão grande sempre no mesmo lugar, fácil de alcançar com o polegar */}
      <div className="sticky bottom-0 mt-6 flex gap-2 bg-gradient-to-t from-[var(--bg)] from-70% to-transparent pt-4">
        {stepIndex > 0 && step !== 'done' && (
          <Button variant="secondary" size="lg" onClick={() => go(-1)} className="px-5">
            {t('common.back')}
          </Button>
        )}
        {step === 'done' ? (
          <Button size="lg" className="flex-1" onClick={finish} disabled={saving}>
            {saving ? t('onboarding.done.preparing') : t('onboarding.done.cta')}
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={() => go(1)} disabled={!canContinue[step] || showMedForm}>
            {step === 'welcome'
              ? t('onboarding.welcome.cta')
              : step === 'medication' && !hasMeds && !notOnMedsYet
                ? t('onboarding.medication.addLater')
                : t('common.continue')}
          </Button>
        )}
      </div>
      {step === 'welcome' && <p className="mt-2 text-center text-xs text-[var(--text-muted)]">{t('onboarding.welcome.time')}</p>}

      {croppingAvatar && (
        <ImageCropper
          file={croppingAvatar}
          aspect={1}
          shape="circle"
          outputSize={320}
          onCancel={() => setCroppingAvatar(null)}
          onConfirm={(dataUrl) => {
            setCroppingAvatar(null)
            setAvatarUrl(dataUrl)
            setAvatarIcon(null)
          }}
        />
      )}
    </div>
  )
}
