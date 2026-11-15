import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { Button, Card } from './ui'
import { Check, Flame, Gift, Potion, X } from './icons'
import {
  useChallenge,
  useCheckin,
  useSubmitMissedDoses,
  useSubmitReview,
  useUsePotion,
  useVisit,
  type CheckinState,
  type PendingDoseGroup,
  type VisitResult,
} from '../api/points'
import { addDays } from '../../shared/points'
import { todayStr } from '../lib/dateUtils'
import { useChallengePrompt } from './ChallengeModal'
import { playSound } from '../lib/sounds'
import { toastError } from '../lib/toast'

// O que aparece ao abrir o app (depois do aviso de versão e do aviso do 8-bit):
// 1) popup do streak com o Brilho do dia (e baú a cada 7 dias / poção pra salvar streak quebrado)
// 2) "e ontem?" — rotinas e treinos de ontem que ficaram sem marcar
// 3) doses esquecidas dos últimos 10 dias, agrupadas por remédio
// Respostas ficam salvas no servidor, então não pergunta de novo. "Depois" só esconde nessa sessão.

const SESSION_KEY = 'aurora.dailyFlowDismissed'

function sessionGet(key: string) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}
function sessionSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // sem sessionStorage, só pode perguntar de novo na próxima abertura
  }
}

// portal no body: dentro do conteúdo da página a barra de baixo ficava por cima do modal
function Overlay({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[95] flex items-end justify-center bg-black/50 p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:items-center sm:pb-4"
      data-overlay
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[78dvh] w-full max-w-sm overflow-y-auto rounded-3xl"
      >
        {children}
      </motion.div>
    </motion.div>,
    document.body,
  )
}

function shortDate(date: string) {
  const d = new Date(`${date}T12:00:00`)
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function StreakPopup({ visit, onClose }: { visit: VisitResult; onClose: () => void }) {
  const potionMut = useUsePotion()
  const [saved, setSaved] = useState<number | null>(null)
  const canRescue = (visit.brokenStreak ?? 0) > 0 && (visit.potions ?? 0) > 0 && saved == null

  function rescue() {
    potionMut.mutate(addDays(todayStr(), -1), {
      onSuccess: (r) => {
        playSound('success')
        setSaved(r.streak)
      },
      onError: (e) => toastError(e),
    })
  }

  return (
    <Overlay onClose={onClose}>
      <Card className="space-y-4 text-center">
        <motion.div
          initial={{ scale: 0.4, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent-soft)]"
        >
          <Flame size={44} className="text-orange-500" />
        </motion.div>
        <div>
          <p className="font-pixel text-4xl font-bold text-[var(--text)]">{saved ?? visit.streak}</p>
          <p className="text-sm font-bold text-[var(--text)]">{(saved ?? visit.streak) === 1 ? 'dia seguido' : 'dias seguidos'}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            +{visit.points} Brilho por passar aqui hoje{saved != null && ' · streak salvo!'}
          </p>
        </div>
        {visit.usedRestDay && (
          <p className="rounded-2xl bg-[var(--surface-2)] p-3 text-sm">
            💤 Ontem foi <b>dia de folga</b>: você não passou aqui, mas seu streak continuou.
          </p>
        )}
        {visit.gotRestDay && !visit.usedRestDay && (
          <p className="rounded-2xl bg-[var(--surface-2)] p-3 text-sm">
            💤 Você ganhou <b>1 dia de folga</b>: se um dia não der pra passar aqui, o streak não quebra.
          </p>
        )}
        {visit.chest && (
          <Link
            to="/missoes"
            onClick={onClose}
            className="flex items-center gap-3 rounded-2xl bg-[var(--accent-soft)] p-3 text-left"
          >
            <Gift size={30} />
            <span className="text-sm">
              <b>7 dias seguidos!</b> Você ganhou um baú raro. Abra em Missões.
            </span>
          </Link>
        )}
        {canRescue && (
          <div className="space-y-2 rounded-2xl border border-[var(--border)] p-3 text-left">
            <p className="text-sm">
              Ontem você não passou aqui e seu streak de <b>{visit.brokenStreak} dias</b> quebrou. Quer usar uma{' '}
              <b>Poção do tempo</b> pra salvar? (você tem {visit.potions})
            </p>
            <Button variant="secondary" className="flex w-full items-center justify-center gap-2" onClick={rescue} disabled={potionMut.isPending}>
              <Potion size={18} /> Usar poção
            </Button>
          </div>
        )}
        <Button className="w-full" onClick={onClose}>
          Bora!
        </Button>
      </Card>
    </Overlay>
  )
}

function ToggleRow({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={clsx(
        'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition',
        checked ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)]',
      )}
    >
      <span
        className={clsx(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
          checked ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]' : 'border-[var(--border)]',
        )}
      >
        {checked && <Check size={13} />}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  )
}

function LateNote({ potions, usePotionFor, onToggle }: { potions: number; usePotionFor: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--text-muted)]">Marcado depois fica no seu histórico, mas não vale Brilho.</p>
      {potions > 0 && (
        <ToggleRow checked={usePotionFor} onChange={onToggle}>
          <span className="flex items-center gap-2">
            <Potion size={18} /> Usar Poção do tempo pra valer Brilho (você tem {potions})
          </span>
        </ToggleRow>
      )}
    </div>
  )
}

function ReviewStep({
  review,
  potions,
  onDone,
  onLater,
}: {
  review: NonNullable<CheckinState['review']>
  potions: number
  onDone: () => void
  onLater: () => void
}) {
  const submit = useSubmitReview()
  const potionMut = useUsePotion()
  const [routines, setRoutines] = useState<Set<number>>(new Set())
  const [workouts, setWorkouts] = useState<Set<number>>(new Set())
  const [potion, setPotion] = useState(false)

  const toggle = (set: Set<number>, id: number, on: boolean) => {
    const next = new Set(set)
    if (on) next.add(id)
    else next.delete(id)
    return next
  }

  async function save() {
    try {
      await submit.mutateAsync({ date: review.date, routineIds: [...routines], workoutDayIds: [...workouts] })
      if (potion && (routines.size || workouts.size)) await potionMut.mutateAsync(review.date)
      playSound('success')
      onDone()
    } catch (e) {
      toastError(e)
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent)]">E ontem? · {shortDate(review.date)}</p>
        <h2 className="text-lg font-extrabold">Você fez isso ontem?</h2>
        <p className="text-sm text-[var(--text-muted)]">Toque no que você fez. O que ficar sem marcar conta como não feito.</p>
      </div>
      <div className="space-y-2">
        {review.workouts.map((w) => (
          <ToggleRow key={`w${w.dayId}`} checked={workouts.has(w.dayId)} onChange={(v) => setWorkouts((s) => toggle(s, w.dayId, v))}>
            <b>{w.name}</b>
            <span className="block text-xs text-[var(--text-muted)]">Treino · {w.programName}</span>
          </ToggleRow>
        ))}
        {review.routines.map((r) => (
          <ToggleRow key={`r${r.id}`} checked={routines.has(r.id)} onChange={(v) => setRoutines((s) => toggle(s, r.id, v))}>
            <b>{r.name}</b>
            <span className="block text-xs text-[var(--text-muted)]">Rotina</span>
          </ToggleRow>
        ))}
      </div>
      <LateNote potions={potions} usePotionFor={potion} onToggle={setPotion} />
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onLater}>
          Depois
        </Button>
        <Button onClick={save} disabled={submit.isPending || potionMut.isPending}>
          Salvar
        </Button>
      </div>
    </Card>
  )
}

function instanceLabel(group: PendingDoseGroup, inst: PendingDoseGroup['instances'][number]) {
  const perDay = group.instances.filter((i) => i.date === inst.date).length
  const time = new Date(inst.scheduledFor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return perDay > 1 ? `${shortDate(inst.date)} · ${time}` : shortDate(inst.date)
}

function DoseStep({
  group,
  potions,
  index,
  total,
  onDone,
  onLater,
}: {
  group: PendingDoseGroup
  potions: number
  index: number
  total: number
  onDone: () => void
  onLater: () => void
}) {
  const submit = useSubmitMissedDoses()
  const potionMut = useUsePotion()
  const [picking, setPicking] = useState(false)
  const [taken, setTaken] = useState<Set<string>>(new Set())
  const [potionDate, setPotionDate] = useState<string | null>(null)
  const days = [...new Set(group.instances.map((i) => i.date))]
  const single = group.instances.length === 1

  async function answer(takenKeys: Set<string>) {
    try {
      await submit.mutateAsync(group.instances.map((i) => ({ medicationId: group.medicationId, scheduledFor: i.scheduledFor, taken: takenKeys.has(i.scheduledFor) })))
      if (potionDate) await potionMut.mutateAsync(potionDate)
      playSound('tap')
      onDone()
    } catch (e) {
      toastError(e)
    }
  }

  const dose = `${group.name} ${group.doseAmount}${group.doseUnit ? ` ${group.doseUnit}` : ''}`

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent)]">
          Doses sem resposta{total > 1 ? ` · ${index + 1} de ${total}` : ''}
        </p>
        {!picking ? (
          <h2 className="text-lg font-extrabold">
            {single
              ? `Você tomou ${dose} ${shortDate(group.instances[0].date)}?`
              : days.length === 1
                ? `Você tomou todas as doses de ${dose} ${shortDate(days[0])}?`
                : `Você tomou ${dose} nesses ${days.length} dias?`}
          </h2>
        ) : (
          <h2 className="text-lg font-extrabold">Marque os dias que você tomou {group.name}</h2>
        )}
        {!picking && !single && (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{days.map(shortDate).join(', ')}</p>
        )}
      </div>

      {picking && (
        <div className="space-y-2">
          {group.instances.map((i) => (
            <ToggleRow
              key={i.scheduledFor}
              checked={taken.has(i.scheduledFor)}
              onChange={(v) =>
                setTaken((s) => {
                  const next = new Set(s)
                  if (v) next.add(i.scheduledFor)
                  else next.delete(i.scheduledFor)
                  return next
                })
              }
            >
              {instanceLabel(group, i)}
            </ToggleRow>
          ))}
        </div>
      )}

      <p className="text-xs text-[var(--text-muted)]">Marcado depois fica no seu histórico, mas não vale Brilho.</p>
      {potions > 0 && picking && taken.size > 0 && (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-xs font-bold">
            <Potion size={16} /> Usar Poção do tempo num dia? (você tem {potions})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[...new Set(group.instances.filter((i) => taken.has(i.scheduledFor)).map((i) => i.date))].map((d) => (
              <button
                key={d}
                onClick={() => setPotionDate((cur) => (cur === d ? null : d))}
                className={clsx(
                  'rounded-full border px-2.5 py-1 text-xs',
                  potionDate === d ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]' : 'border-[var(--border)]',
                )}
              >
                {shortDate(d)}
              </button>
            ))}
          </div>
        </div>
      )}

      {!picking ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => (single ? answer(new Set()) : setPicking(true))} disabled={submit.isPending}>
              {single ? 'Não tomei' : 'Nem todos'}
            </Button>
            <Button onClick={() => answer(new Set(group.instances.map((i) => i.scheduledFor)))} disabled={submit.isPending}>
              {single ? 'Tomei' : 'Sim, todos'}
            </Button>
          </div>
          <button onClick={onLater} className="w-full py-1 text-sm text-[var(--text-muted)]">
            Responder depois
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setPicking(false)}>
            Voltar
          </Button>
          <Button onClick={() => answer(taken)} disabled={submit.isPending || potionMut.isPending}>
            Salvar
          </Button>
        </div>
      )}
    </Card>
  )
}

function CheckinModal({ onClose }: { onClose: () => void }) {
  const { data } = useCheckin()
  const [reviewDone, setReviewDone] = useState(false)
  const [doseIndex, setDoseIndex] = useState(0)
  // fixa a lista do começo: depois de cada resposta o refetch tira o remédio respondido da lista
  const groupsRef = useRef<PendingDoseGroup[] | null>(null)
  if (data && groupsRef.current == null) groupsRef.current = data.doses
  const groups = groupsRef.current ?? []

  const showReview = !!data?.review && !reviewDone
  const group = groups[doseIndex]
  const finished = !!data && !showReview && !group
  useEffect(() => {
    if (finished) onClose()
  }, [finished, onClose])

  if (!data || finished) return null

  return (
    <Overlay>
      <div className="relative">
        <button onClick={onClose} aria-label="Fechar" className="absolute right-3 top-3 z-10 p-1 text-[var(--text-muted)]">
          <X size={18} />
        </button>
        {showReview && data.review ? (
          <ReviewStep review={data.review} potions={data.potions} onDone={() => setReviewDone(true)} onLater={onClose} />
        ) : (
          group && (
            <DoseStep
              key={group.medicationId}
              group={group}
              potions={data.potions}
              index={doseIndex}
              total={groups.length}
              onDone={() => setDoseIndex((i) => i + 1)}
              onLater={onClose}
            />
          )
        )}
      </div>
    </Overlay>
  )
}

export default function DailyFlow() {
  const visit = useVisit()
  const today = todayStr()
  const [visitResult, setVisitResult] = useState<VisitResult | null>(null)
  const [stage, setStage] = useState<'visit' | 'challenge' | 'checkin' | 'done'>(() => (sessionGet(SESSION_KEY) === today ? 'done' : 'visit'))
  const startedRef = useRef(false)
  const { data: checkin } = useCheckin(stage === 'checkin')
  const { data: challenge, isError: challengeError } = useChallenge(stage === 'challenge')
  const showPrompt = useChallengePrompt((s) => s.show)
  const prompt = useChallengePrompt((s) => s.prompt)
  const promptShownRef = useRef(false)

  // convite "você quase fez a semana perfeita" — aparece no máximo uma vez por semana
  useEffect(() => {
    if (stage !== 'challenge') return
    if (challengeError) return setStage('checkin')
    if (!challenge) return
    if (!promptShownRef.current) {
      if (challenge.almost.length === 0) return setStage('checkin')
      promptShownRef.current = true
      showPrompt({ kind: 'almost', routines: challenge.almost })
    } else if (!prompt) {
      setStage('checkin')
    }
  }, [stage, challenge, challengeError, prompt, showPrompt])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    visit.mutate(undefined, {
      onSuccess: (r) => {
        if (r.isNew) {
          playSound('coin')
          setVisitResult(r)
        } else setStage((s) => (s === 'visit' ? 'challenge' : s))
      },
      onError: () => setStage((s) => (s === 'visit' ? 'challenge' : s)),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function finish() {
    sessionSet(SESSION_KEY, today)
    setStage('done')
  }

  const hasCheckin = !!checkin && (checkin.review != null || checkin.doses.length > 0)
  return (
    <AnimatePresence>
      {stage === 'visit' && visitResult && (
        <StreakPopup
          key="streak"
          visit={visitResult}
          onClose={() => {
            setVisitResult(null)
            setStage('challenge')
          }}
        />
      )}
      {stage === 'checkin' && hasCheckin && <CheckinModal key="checkin" onClose={finish} />}
    </AnimatePresence>
  )
}

