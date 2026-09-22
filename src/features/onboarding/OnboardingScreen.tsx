import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Button, Card } from '../../components/ui'
import Avatar from '../../components/Avatar'
import ImageCropper from '../../components/ImageCropper'
import { useUpdateProfile } from '../../api/profile'
import MedicationForm from '../medications/MedicationForm'
import { useMedications } from '../../api/medications'
import { PRONOUN_PRESETS } from '../../lib/pronouns'
import { SUPPORTED_LANGUAGES } from '../../i18n'
import type { TextStyle, ContentPreference, AppModule } from '../../../shared/types'

const TOTAL_STEPS = 11

const stepVariants = {
  enter: { opacity: 0, y: 28 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -28 },
}

const containerVariants = {
  enter: {},
  center: { transition: { staggerChildren: 0.28, delayChildren: 0.15 } },
}
const lineVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0 },
}

function StepShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex min-h-[70svh] flex-col justify-center"
    >
      {children}
    </motion.div>
  )
}

function OptionList<T extends string>({
  options,
  selected,
  onSelect,
  multi,
}: {
  options: { value: T; label: string; hint?: string }[]
  selected: T[]
  onSelect: (value: T) => void
  multi?: boolean
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={
              'w-full cursor-pointer rounded-xl border px-4 py-3 text-left transition active:scale-[0.98] ' +
              (isSelected
                ? 'border-[var(--accent)] bg-[var(--surface-2)]'
                : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]/60')
            }
          >
            <span className="flex items-center justify-between text-sm font-medium text-[var(--text)]">
              {opt.label}
              {isSelected && <span className="text-[var(--accent)]">{multi ? '✓' : '●'}</span>}
            </span>
            {opt.hint && <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{opt.hint}</span>}
          </button>
        )
      })}
    </div>
  )
}

const AVATAR_ICONS = ['🦋', '🌸', '✨', '🌈', '💫', '🐱', '🦄', '💖', '🍑', '🧁', '🌙', '🌻']

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { t, i18n } = useTranslation()
  const updateProfile = useUpdateProfile()
  const { data: medications } = useMedications()
  const [step, setStep] = useState(0)

  const [pronouns, setPronouns] = useState('')
  const [customPronouns, setCustomPronouns] = useState(false)
  const [textStyle, setTextStyle] = useState<TextStyle>('feminine')
  const [contentPreference, setContentPreference] = useState<ContentPreference>('feminine')
  const [isOnHrt, setIsOnHrt] = useState<boolean | null>(null)
  const [showMedForm, setShowMedForm] = useState(false)
  const [notOnMedsYet, setNotOnMedsYet] = useState(false)
  const [goals, setGoals] = useState<AppModule[]>(['medications', 'mood', 'calendar', 'measurements'])
  const [workoutsEnabled, setWorkoutsEnabled] = useState(false)
  const [cycleTrackingEnabled, setCycleTrackingEnabled] = useState(false)
  const [intimateTrackingEnabled, setIntimateTrackingEnabled] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarIcon, setAvatarIcon] = useState<string | null>(null)
  const [croppingAvatar, setCroppingAvatar] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  function toggleGoal(g: AppModule) {
    setGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]))
  }

  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setCroppingAvatar(file)
    e.target.value = ''
  }

  async function finish() {
    setSaving(true)
    try {
      await updateProfile.mutateAsync({
        pronouns,
        textStyle,
        contentPreference,
        isOnHrt,
        notOnMedsYet,
        appGoals: goals,
        enabledModules: goals,
        workoutsEnabled,
        cycleTrackingEnabled,
        intimateTrackingEnabled,
        displayName,
        avatarUrl,
        avatarIcon,
        onboardingCompleted: true,
      })
      onComplete()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-app w-full max-w-md flex-col justify-between px-6 py-8 text-[var(--text)]">
      {step > 0 && (
        <div className="mb-4 flex gap-1">
          {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
            <div
              key={i}
              className={
                'h-1 flex-1 rounded-full ' + (i < step ? 'flag-gradient' : 'bg-[var(--border)]')
              }
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 0 && (
          <StepShell key="welcome">
            <motion.div variants={containerVariants} initial="enter" animate="center" className="space-y-4 text-center">
              <motion.p variants={lineVariants} className="text-4xl">
                🦋
              </motion.p>
              <motion.p variants={lineVariants} className="font-logo flag-gradient-text text-2xl uppercase tracking-wide">
                {t('common.appName')}
              </motion.p>
              <motion.h1 variants={lineVariants} className="text-2xl font-semibold">
                {t('onboarding.welcome.title')}
              </motion.h1>
              <motion.p variants={lineVariants} className="text-[var(--text-muted)]">
                {t('onboarding.welcome.p1')}
              </motion.p>
              <motion.p variants={lineVariants} className="text-[var(--text-muted)]">
                {t('onboarding.welcome.p2')}
              </motion.p>
              <motion.div variants={lineVariants}>
                <Button className="mt-4 w-full" onClick={next}>
                  {t('onboarding.welcome.cta')}
                </Button>
              </motion.div>
            </motion.div>
          </StepShell>
        )}

        {step === 1 && (
          <StepShell key="language">
            <h2 className="mb-1 text-xl font-semibold">{t('onboarding.language.title')}</h2>
            <p className="mb-4 text-sm text-[var(--text-muted)]">{t('onboarding.language.subtitle')}</p>
            <OptionList
              options={SUPPORTED_LANGUAGES.map((l) => ({ value: l.code, label: l.label }))}
              selected={[i18n.resolvedLanguage as (typeof SUPPORTED_LANGUAGES)[number]['code']]}
              onSelect={(code) => i18n.changeLanguage(code)}
            />
            <Button className="mt-5 w-full" onClick={next}>
              {t('common.continue')}
            </Button>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell key="pronouns">
            <h2 className="mb-1 text-xl font-semibold">{t('onboarding.pronouns.title')}</h2>
            <p className="mb-4 text-sm text-[var(--text-muted)]">{t('onboarding.pronouns.subtitle')}</p>
            <OptionList
              options={[
                { value: 'ela/dela', label: 'Ela/dela' },
                { value: 'ele/dele', label: 'Ele/dele' },
                { value: 'elu/delu', label: 'Elu/delu' },
              ]}
              selected={!customPronouns && pronouns ? [pronouns] : []}
              onSelect={(v) => {
                setCustomPronouns(false)
                setPronouns(v)
                // só um ponto de partida — o próximo passo deixa a pessoa confirmar ou trocar
                setTextStyle(v === 'ele/dele' ? 'masculine' : v === 'elu/delu' ? 'neutral' : 'feminine')
              }}
            />
            <button
              type="button"
              onClick={() => {
                setCustomPronouns(true)
                if (PRONOUN_PRESETS.includes(pronouns)) setPronouns('')
              }}
              className={
                'mt-2 w-full cursor-pointer rounded-xl border px-4 py-3 text-left text-sm font-medium transition active:scale-[0.98] ' +
                (customPronouns
                  ? 'border-[var(--accent)] bg-[var(--surface-2)] text-[var(--text)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]/60')
              }
            >
              {t('onboarding.pronouns.other')}
            </button>
            {customPronouns && (
              <input
                autoFocus
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder={t('onboarding.pronouns.placeholder')}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text)] outline-none focus:border-[var(--accent)]"
              />
            )}
            <Button className="mt-5 w-full" onClick={next} disabled={!pronouns.trim()}>
              {t('common.continue')}
            </Button>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell key="textStyle">
            <h2 className="mb-1 text-xl font-semibold">{t('onboarding.textStyle.title')}</h2>
            <p className="mb-4 text-sm text-[var(--text-muted)]">{t('onboarding.textStyle.subtitle')}</p>
            <OptionList
              options={[
                { value: 'feminine', label: t('onboarding.textStyle.feminine'), hint: t('onboarding.textStyle.feminineHint') },
                { value: 'masculine', label: t('onboarding.textStyle.masculine'), hint: t('onboarding.textStyle.masculineHint') },
                { value: 'neutral', label: t('onboarding.textStyle.neutral'), hint: t('onboarding.textStyle.neutralHint') },
              ]}
              selected={[textStyle]}
              onSelect={(v) => setTextStyle(v as TextStyle)}
            />
            <Button className="mt-5 w-full" onClick={next}>
              {t('common.continue')}
            </Button>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell key="identity">
            <h2 className="mb-1 text-xl font-semibold">{t('onboarding.identity.title')}</h2>
            <p className="mb-4 text-sm text-[var(--text-muted)]">{t('onboarding.identity.subtitle')}</p>
            <OptionList
              options={[
                { value: 'feminine', label: t('onboarding.identity.feminine') },
                { value: 'masculine', label: t('onboarding.identity.masculine') },
                { value: 'combined', label: t('onboarding.identity.combined') },
              ]}
              selected={[contentPreference]}
              onSelect={(v) => setContentPreference(v as ContentPreference)}
            />
            <Button className="mt-5 w-full" onClick={next}>
              {t('common.continue')}
            </Button>
          </StepShell>
        )}

        {step === 5 && (
          <StepShell key="hrt">
            <h2 className="mb-1 text-xl font-semibold">{t('onboarding.hrt.title')}</h2>
            <p className="mb-4 text-sm text-[var(--text-muted)]">{t('onboarding.hrt.subtitle')}</p>
            <OptionList
              options={[
                { value: 'yes', label: t('onboarding.hrt.yes') },
                { value: 'planning', label: t('onboarding.hrt.planning') },
                { value: 'unsure', label: t('onboarding.hrt.unsure') },
              ]}
              selected={isOnHrt === true ? ['yes'] : isOnHrt === false ? ['planning'] : []}
              onSelect={(v) => setIsOnHrt(v === 'yes')}
            />
            <Card className="mt-4 border-[var(--accent)] text-xs text-[var(--text-muted)]">
              {t('onboarding.hrt.disclaimer')}
            </Card>
            <Button className="mt-5 w-full" onClick={next}>
              {t('common.continue')}
            </Button>
          </StepShell>
        )}

        {step === 6 && (
          <StepShell key="medication">
            <h2 className="mb-1 text-xl font-semibold">
              {isOnHrt ? t('onboarding.medication.titleOnHrt') : t('onboarding.medication.titlePlanning')}
            </h2>
            <p className="mb-4 text-sm text-[var(--text-muted)]">{t('onboarding.medication.subtitle')}</p>

            {medications && medications.length > 0 && (
              <div className="mb-3 space-y-1">
                {medications.map((m) => (
                  <p key={m.id} className="text-sm text-[var(--text)]">
                    💊 {m.name}
                  </p>
                ))}
              </div>
            )}

            {showMedForm ? (
              <MedicationForm onDone={() => setShowMedForm(false)} />
            ) : (medications?.length ?? 0) > 0 ? (
              <div className="space-y-2">
                <Button variant="secondary" className="w-full" onClick={() => setShowMedForm(true)}>
                  {t('onboarding.medication.addAnother')}
                </Button>
                <Button className="w-full" onClick={next}>
                  {t('common.continue')}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button variant="secondary" className="w-full" onClick={() => setShowMedForm(true)}>
                  {t('onboarding.medication.add')}
                </Button>
                <Button variant="ghost" className="w-full" onClick={next}>
                  {t('onboarding.medication.addLater')}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setNotOnMedsYet(true)
                    next()
                  }}
                >
                  {t('onboarding.medication.notYet')}
                </Button>
              </div>
            )}
          </StepShell>
        )}

        {step === 7 && (
          <StepShell key="goals">
            <h2 className="mb-1 text-xl font-semibold">{t('onboarding.goals.title')}</h2>
            <p className="mb-4 text-sm text-[var(--text-muted)]">{t('onboarding.goals.subtitle')}</p>
            <OptionList
              multi
              options={[
                { value: 'mood', label: t('onboarding.goals.mood'), hint: t('onboarding.goals.moodHint') },
                ...(isOnHrt !== false
                  ? [{ value: 'medications' as AppModule, label: t('onboarding.goals.medications'), hint: t('onboarding.goals.medicationsHint') }]
                  : []),
                { value: 'calendar', label: t('onboarding.goals.calendar'), hint: t('onboarding.goals.calendarHint') },
                { value: 'measurements', label: t('onboarding.goals.measurements'), hint: t('onboarding.goals.measurementsHint') },
              ]}
              selected={goals}
              onSelect={toggleGoal}
            />

            <p className="mb-2 mt-4 text-xs font-medium text-[var(--text-muted)]">{t('onboarding.goals.optional')}</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setWorkoutsEnabled((v) => !v)}
                className={
                  'w-full cursor-pointer rounded-xl border px-4 py-3 text-left transition active:scale-[0.98] ' +
                  (workoutsEnabled
                    ? 'border-[var(--accent)] bg-[var(--surface-2)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]/60')
                }
              >
                <span className="flex items-center justify-between text-sm font-medium text-[var(--text)]">
                  {t('onboarding.goals.workouts')}
                  {workoutsEnabled && <span className="text-[var(--accent)]">✓</span>}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{t('onboarding.goals.workoutsHint')}</span>
              </button>
              <button
                type="button"
                onClick={() => setCycleTrackingEnabled((v) => !v)}
                className={
                  'w-full cursor-pointer rounded-xl border px-4 py-3 text-left transition active:scale-[0.98] ' +
                  (cycleTrackingEnabled
                    ? 'border-[var(--accent)] bg-[var(--surface-2)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]/60')
                }
              >
                <span className="flex items-center justify-between text-sm font-medium text-[var(--text)]">
                  {t('onboarding.goals.cycle')}
                  {cycleTrackingEnabled && <span className="text-[var(--accent)]">✓</span>}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{t('onboarding.goals.cycleHint')}</span>
              </button>
              <button
                type="button"
                onClick={() => setIntimateTrackingEnabled((v) => !v)}
                className={
                  'w-full cursor-pointer rounded-xl border px-4 py-3 text-left transition active:scale-[0.98] ' +
                  (intimateTrackingEnabled
                    ? 'border-[var(--accent)] bg-[var(--surface-2)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]/60')
                }
              >
                <span className="flex items-center justify-between text-sm font-medium text-[var(--text)]">
                  {t('onboarding.goals.intimate')}
                  {intimateTrackingEnabled && <span className="text-[var(--accent)]">✓</span>}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{t('onboarding.goals.intimateHint')}</span>
              </button>
            </div>

            <Card className="mt-4 border-[var(--accent)] text-xs text-[var(--text-muted)]">{t('onboarding.goals.tip')}</Card>

            <Button className="mt-5 w-full" onClick={next}>
              {t('common.continue')}
            </Button>
          </StepShell>
        )}

        {step === 8 && (
          <StepShell key="name">
            <h2 className="mb-1 text-xl font-semibold">{t('onboarding.name.title')}</h2>
            <p className="mb-4 text-sm text-[var(--text-muted)]">{t('onboarding.name.subtitle')}</p>
            <input
              autoFocus
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('onboarding.name.placeholder')}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
            <Button className="mt-5 w-full" onClick={next} disabled={!displayName.trim()}>
              {t('common.continue')}
            </Button>
          </StepShell>
        )}

        {step === 9 && (
          <StepShell key="avatar">
            <h2 className="mb-1 text-xl font-semibold">{t('onboarding.avatar.title')}</h2>
            <p className="mb-4 text-sm text-[var(--text-muted)]">{t('onboarding.avatar.subtitle')}</p>

            <div className="mb-4 flex justify-center">
              <Avatar src={avatarUrl} icon={avatarIcon} name={displayName} size={88} />
            </div>

            <label className="mb-3 block">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
              <span className="block w-full cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-center text-sm text-[var(--text)]">
                {t('onboarding.avatar.upload')}
              </span>
            </label>

            <div className="grid grid-cols-6 gap-2">
              {AVATAR_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    setAvatarIcon(icon)
                    setAvatarUrl(null)
                  }}
                  className={
                    'flex h-10 cursor-pointer items-center justify-center rounded-lg border text-xl transition active:scale-90 ' +
                    (avatarIcon === icon
                      ? 'border-[var(--accent)] bg-[var(--surface-2)]'
                      : 'border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]/60')
                  }
                >
                  {icon}
                </button>
              ))}
            </div>

            <Button className="mt-5 w-full" onClick={next}>
              {t('common.continue')}
            </Button>
          </StepShell>
        )}

        {step === 10 && (
          <StepShell key="done">
            <motion.div variants={containerVariants} initial="enter" animate="center" className="space-y-4 text-center">
              <motion.p variants={lineVariants} className="text-4xl">
                🎉
              </motion.p>
              <motion.h1 variants={lineVariants} className="text-2xl font-semibold">
                {/* "Tudo pronto" concorda com "tudo" (masculino fixo em português), não com a pessoa —
                    não é o pronto/a/e de gênero do sujeito, então não flexiona por textStyle. */}
                {t('onboarding.done.ready')}
                {displayName ? `, ${displayName}` : ''}!
              </motion.h1>
              <motion.p variants={lineVariants} className="text-[var(--text-muted)]">
                {t('onboarding.done.subtitle', {
                  items:
                    [
                      goals.includes('medications') && t('onboarding.done.trackingDoses'),
                      goals.includes('mood') && t('onboarding.done.trackingMood'),
                      workoutsEnabled && t('onboarding.done.trackingWorkouts'),
                      cycleTrackingEnabled && t('onboarding.done.trackingCycle'),
                      intimateTrackingEnabled && t('onboarding.done.trackingIntimate'),
                    ]
                      .filter(Boolean)
                      .join(', ') || t('onboarding.done.trackingFallback'),
                })}
              </motion.p>
              <motion.div variants={lineVariants}>
                <Button className="mt-4 w-full" onClick={finish} disabled={saving}>
                  {saving ? t('onboarding.done.preparing') : t('onboarding.done.cta')}
                </Button>
              </motion.div>
            </motion.div>
          </StepShell>
        )}
      </AnimatePresence>

      {step > 0 && step < TOTAL_STEPS - 1 && (
        <button onClick={back} className="mt-4 text-center text-xs text-[var(--text-muted)]">
          {t('common.back')}
        </button>
      )}

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
