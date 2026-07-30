import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Card } from '../../components/ui'
import Avatar from '../../components/Avatar'
import { useUpdateProfile } from '../../api/profile'
import MedicationForm from '../medications/MedicationForm'
import { useMedications } from '../../api/medications'
import { fileToResizedDataUrl } from '../../lib/image'
import type { TextStyle, ContentPreference, AppModule } from '../../../shared/types'

const TOTAL_STEPS = 9

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
              'w-full rounded-xl border px-4 py-3 text-left transition ' +
              (isSelected
                ? 'border-[var(--accent)] bg-[var(--surface-2)]'
                : 'border-[var(--border)] bg-[var(--surface)]')
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
  const updateProfile = useUpdateProfile()
  const { data: medications } = useMedications()
  const [step, setStep] = useState(0)

  const [pronouns, setPronouns] = useState('')
  const [textStyle, setTextStyle] = useState<TextStyle>('feminine')
  const [contentPreference, setContentPreference] = useState<ContentPreference>('feminine')
  const [isOnHrt, setIsOnHrt] = useState<boolean | null>(null)
  const [showMedForm, setShowMedForm] = useState(false)
  const [notOnMedsYet, setNotOnMedsYet] = useState(false)
  const [goals, setGoals] = useState<AppModule[]>(['medications', 'mood', 'calendar', 'measurements'])
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarIcon, setAvatarIcon] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
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

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await fileToResizedDataUrl(file)
      setAvatarUrl(dataUrl)
      setAvatarIcon(null)
    } finally {
      setUploading(false)
    }
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

  const treat = (fem: string, masc: string) => (textStyle === 'masculine' ? masc : fem)

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-between px-6 py-8 text-[var(--text)]">
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
                Aurora
              </motion.p>
              <motion.h1 variants={lineVariants} className="text-2xl font-semibold">
                Que bom ter você aqui.
              </motion.h1>
              <motion.p variants={lineVariants} className="text-[var(--text-muted)]">
                Esse é um espaço só seu para acompanhar sua transição — no seu tempo, do seu jeito.
              </motion.p>
              <motion.p variants={lineVariants} className="text-[var(--text-muted)]">
                Vamos fazer algumas perguntas rápidas para deixar tudo do jeitinho que funciona pra você.
              </motion.p>
              <motion.div variants={lineVariants}>
                <Button className="mt-4 w-full" onClick={next}>
                  Vamos começar
                </Button>
              </motion.div>
            </motion.div>
          </StepShell>
        )}

        {step === 1 && (
          <StepShell key="pronouns">
            <h2 className="mb-1 text-xl font-semibold">Quais são seus pronomes?</h2>
            <p className="mb-4 text-sm text-[var(--text-muted)]">
              Vamos usar isso para escrever as próximas mensagens do jeito certo.
            </p>
            <OptionList
              options={[
                { value: 'ela/dela', label: 'Ela/dela' },
                { value: 'ele/dele', label: 'Ele/dele' },
                { value: 'elu/delu', label: 'Elu/delu' },
              ]}
              selected={pronouns ? [pronouns] : []}
              onSelect={(v) => {
                setPronouns(v)
                setTextStyle(v === 'ele/dele' ? 'masculine' : 'feminine')
              }}
            />
            <Button className="mt-5 w-full" onClick={next} disabled={!pronouns}>
              Continuar
            </Button>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell key="identity">
            <h2 className="mb-1 text-xl font-semibold">
              Como você se identifica?
            </h2>
            <p className="mb-4 text-sm text-[var(--text-muted)]">
              Isso ajusta quais medidas e sugestões de medicamento aparecem pra você — pode mudar quando
              quiser no Perfil.
            </p>
            <OptionList
              options={[
                { value: 'feminine', label: 'Mulher trans' },
                { value: 'masculine', label: 'Homem trans' },
                { value: 'combined', label: 'Não-binário / prefiro não dizer' },
              ]}
              selected={[contentPreference]}
              onSelect={(v) => setContentPreference(v as ContentPreference)}
            />
            <Button className="mt-5 w-full" onClick={next}>
              Continuar
            </Button>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell key="hrt">
            <h2 className="mb-1 text-xl font-semibold">Você está fazendo transição hormonal?</h2>
            <p className="mb-4 text-sm text-[var(--text-muted)]">
              Seja qual for a resposta, esse app fica com você.
            </p>
            <OptionList
              options={[
                { value: 'yes', label: 'Sim, já estou' },
                { value: 'planning', label: 'Ainda não, mas pretendo' },
                { value: 'unsure', label: 'Ainda não decidi' },
              ]}
              selected={isOnHrt === true ? ['yes'] : isOnHrt === false ? ['planning'] : []}
              onSelect={(v) => setIsOnHrt(v === 'yes')}
            />
            <Card className="mt-4 border-[var(--accent)] text-xs text-[var(--text-muted)]">
              💡 Esse app é feito para dar dicas e ajudar a acompanhar suas doses e sua saúde mental — ele
              não substitui acompanhamento médico.
            </Card>
            <Button className="mt-5 w-full" onClick={next}>
              Continuar
            </Button>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell key="medication">
            <h2 className="mb-1 text-xl font-semibold">O que você está tomando?</h2>
            <p className="mb-4 text-sm text-[var(--text-muted)]">
              Pode adicionar agora (e quantos quiser) ou deixar para depois.
            </p>

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
                  + Adicionar outro
                </Button>
                <Button className="w-full" onClick={next}>
                  Continuar
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button variant="secondary" className="w-full" onClick={() => setShowMedForm(true)}>
                  + Adicionar medicamento
                </Button>
                <Button variant="ghost" className="w-full" onClick={next}>
                  Adicionar depois
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setNotOnMedsYet(true)
                    next()
                  }}
                >
                  Ainda não tomo medicamento
                </Button>
              </div>
            )}
          </StepShell>
        )}

        {step === 5 && (
          <StepShell key="goals">
            <h2 className="mb-1 text-xl font-semibold">O que você procura no app?</h2>
            <p className="mb-4 text-sm text-[var(--text-muted)]">
              Escolha quantos quiser — isso define o que aparece no menu.
            </p>
            <OptionList
              multi
              options={[
                { value: 'mood', label: '💜 Bem-estar emocional', hint: 'check-in de humor e libido' },
                { value: 'medications', label: '💊 Doses e medicamentos', hint: 'lembretes e histórico' },
                { value: 'calendar', label: '🗓️ Histórico e progresso', hint: 'calendário completo' },
                { value: 'measurements', label: '📏 Medidas corporais', hint: 'com tutoriais de como medir' },
              ]}
              selected={goals}
              onSelect={toggleGoal}
            />
            <Button className="mt-5 w-full" onClick={next}>
              Continuar
            </Button>
          </StepShell>
        )}

        {step === 6 && (
          <StepShell key="name">
            <h2 className="mb-1 text-xl font-semibold">Como devemos te chamar?</h2>
            <p className="mb-4 text-sm text-[var(--text-muted)]">Pode ser seu nome, apelido, o que preferir.</p>
            <input
              autoFocus
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
            <Button className="mt-5 w-full" onClick={next} disabled={!displayName.trim()}>
              Continuar
            </Button>
          </StepShell>
        )}

        {step === 7 && (
          <StepShell key="avatar">
            <h2 className="mb-1 text-xl font-semibold">Quer adicionar uma foto?</h2>
            <p className="mb-4 text-sm text-[var(--text-muted)]">
              Ou escolha um dos nossos ícones fofinhos.
            </p>

            <div className="mb-4 flex justify-center">
              <Avatar src={avatarUrl} icon={avatarIcon} name={displayName} size={88} />
            </div>

            <label className="mb-3 block">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
              <span className="block w-full cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-center text-sm text-[var(--text)]">
                {uploading ? 'Carregando…' : '📷 Enviar uma foto'}
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
                    'flex h-10 items-center justify-center rounded-lg border text-xl transition ' +
                    (avatarIcon === icon
                      ? 'border-[var(--accent)] bg-[var(--surface-2)]'
                      : 'border-[var(--border)]')
                  }
                >
                  {icon}
                </button>
              ))}
            </div>

            <Button className="mt-5 w-full" onClick={next}>
              Continuar
            </Button>
          </StepShell>
        )}

        {step === 8 && (
          <StepShell key="done">
            <motion.div variants={containerVariants} initial="enter" animate="center" className="space-y-4 text-center">
              <motion.p variants={lineVariants} className="text-4xl">
                🎉
              </motion.p>
              <motion.h1 variants={lineVariants} className="text-2xl font-semibold">
                Tudo {treat('pronta', 'pronto')}
                {displayName ? `, ${displayName}` : ''}!
              </motion.h1>
              <motion.p variants={lineVariants} className="text-[var(--text-muted)]">
                Você pode mudar qualquer uma dessas respostas depois, lá no Perfil.
              </motion.p>
              <motion.div variants={lineVariants}>
                <Button className="mt-4 w-full" onClick={finish} disabled={saving}>
                  {saving ? 'Preparando…' : 'Começar a usar'}
                </Button>
              </motion.div>
            </motion.div>
          </StepShell>
        )}
      </AnimatePresence>

      {step > 0 && step < TOTAL_STEPS - 1 && (
        <button onClick={back} className="mt-4 text-center text-xs text-[var(--text-muted)]">
          ← Voltar
        </button>
      )}
    </div>
  )
}
