import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { create } from 'zustand'
import { Button, Card } from './ui'
import { Target } from './icons'
import { useChallengeSeen, useSetRoutineMode } from '../api/points'
import { POINTS } from '../../shared/points'
import { playSound } from '../lib/sounds'
import { toastError } from '../lib/toast'

// Convite da Semana Perfeita (rotina que paga tudo no domingo com +50%, se feita todo dia).
// - 'intro': uma vez só na vida, na primeira vez que a pessoa conclui uma rotina.
// - 'almost': no começo da semana, quando a semana passada quase foi perfeita (no máximo 1x/semana).

type Prompt =
  | { kind: 'intro'; routine: { id: number; name: string } }
  | { kind: 'almost'; routines: { routineId: number; name: string; done: number; due: number; canStartNow: boolean }[] }

interface PromptState {
  prompt: Prompt | null
  show: (p: Prompt) => void
  close: () => void
}

export const useChallengePrompt = create<PromptState>()((set) => ({
  prompt: null,
  show: (prompt) => set({ prompt }),
  close: () => set({ prompt: null }),
}))

const BONUS = Math.round((POINTS.perfectWeekMultiplier - 1) * 100)

function nextMondayLabel(from: string) {
  return new Date(`${from}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })
}

function IntroBody({ routine, onClose }: { routine: { id: number; name: string }; onClose: () => void }) {
  const setMode = useSetRoutineMode()
  const [result, setResult] = useState<'yes' | 'no' | null>(null)
  const [from, setFrom] = useState<string | null>(null)

  function accept(ids: number[] | 'all') {
    setMode.mutate(
      { routineIds: ids, mode: 'weekly', when: 'next' },
      {
        onSuccess: (r) => {
          playSound('success')
          setFrom(r[0]?.from ?? null)
          setResult('yes')
        },
        onError: (e) => toastError(e),
      },
    )
  }

  if (result === 'yes') {
    return (
      <>
        <h2 className="text-lg font-extrabold">Combinado! 🎯</h2>
        <p className="text-sm text-[var(--text-muted)]">
          A Semana Perfeita começa {from ? nextMondayLabel(from) : 'na segunda'}. Até lá, continua valendo +{POINTS.routinePerDay} por dia.
        </p>
        <Button className="w-full" onClick={onClose}>
          Bora!
        </Button>
      </>
    )
  }
  if (result === 'no') {
    return (
      <>
        <h2 className="text-lg font-extrabold">Tudo bem!</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Você pode mudar quando quiser editando ou criando uma rotina — a mudança vale a partir do começo da semana seguinte.
        </p>
        <Button className="w-full" onClick={onClose}>
          Entendi
        </Button>
      </>
    )
  }
  return (
    <>
      <h2 className="text-lg font-extrabold">Quer ganhar mais Brilho?</h2>
      <p className="text-sm text-[var(--text-muted)]">
        Na <b className="text-[var(--text)]">Semana Perfeita</b>, a rotina não paga por dia: junta tudo e paga no domingo, com <b className="text-[var(--text)]">+{BONUS}%</b> — se você fizer
        em todos os dias da semana. Faltou um dia, aquela rotina não paga naquela semana.
      </p>
      <div className="space-y-2">
        <Button className="w-full" onClick={() => accept([routine.id])} disabled={setMode.isPending}>
          Quero, em “{routine.name}”
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => accept('all')} disabled={setMode.isPending}>
          Quero, em todas as rotinas
        </Button>
        <button onClick={() => setResult('no')} className="w-full py-1 text-sm text-[var(--text-muted)]">
          Agora não
        </button>
      </div>
    </>
  )
}

function AlmostBody({ routines, onClose }: { routines: Extract<Prompt, { kind: 'almost' }>['routines']; onClose: () => void }) {
  const setMode = useSetRoutineMode()
  const [done, setDone] = useState(false)
  const perfect = routines.every((r) => r.done === r.due)
  const canNow = routines.some((r) => r.canStartNow)

  function accept() {
    setMode.mutate(
      { routineIds: routines.map((r) => r.routineId), mode: 'weekly', when: 'now' },
      {
        onSuccess: () => {
          playSound('success')
          setDone(true)
        },
        onError: (e) => toastError(e),
      },
    )
  }

  if (done) {
    return (
      <>
        <h2 className="text-lg font-extrabold">Desafio aceito! 🎯</h2>
        <p className="text-sm text-[var(--text-muted)]">
          {canNow ? 'Vale já nessa semana.' : 'Como você já marcou essas rotinas essa semana, começa na segunda.'} Faça todo dia e o Brilho vem no domingo com +{BONUS}%.
        </p>
        <Button className="w-full" onClick={onClose}>
          Bora!
        </Button>
      </>
    )
  }
  return (
    <>
      <h2 className="text-lg font-extrabold">{perfect ? 'Que semana!' : 'Você quase fez a semana perfeita!'}</h2>
      <div className="space-y-1">
        {routines.map((r) => (
          <p key={r.routineId} className="text-sm">
            <b>{r.name}</b>: {r.done} de {r.due} dias
          </p>
        ))}
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        {perfect ? 'Que tal valer mais por isso?' : 'Aposto que essa semana você consegue.'} Na Semana Perfeita, fazendo todo dia, você ganha +{BONUS}% no domingo.
      </p>
      <div className="space-y-2">
        <Button className="w-full" onClick={accept} disabled={setMode.isPending}>
          Topo o desafio!
        </Button>
        <button onClick={onClose} className="w-full py-1 text-sm text-[var(--text-muted)]">
          Agora não
        </button>
      </div>
    </>
  )
}

export default function ChallengeModal() {
  const prompt = useChallengePrompt((s) => s.prompt)
  const close = useChallengePrompt((s) => s.close)
  const seen = useChallengeSeen()
  const kind = prompt?.kind

  // marca como visto assim que aparece — o convite é único mesmo se a pessoa fechar o app
  useEffect(() => {
    if (kind) seen.mutate(kind)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind])

  const handleClose = close

  return createPortal(
    <AnimatePresence>
      {prompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-end justify-center bg-black/50 p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:items-center sm:pb-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm"
          >
            <Card className="space-y-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                <Target size={28} className="text-[var(--accent)]" />
              </span>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent)]">Semana Perfeita</p>
              {prompt.kind === 'intro' ? (
                <IntroBody routine={prompt.routine} onClose={handleClose} />
              ) : (
                <AlmostBody routines={prompt.routines} onClose={handleClose} />
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
