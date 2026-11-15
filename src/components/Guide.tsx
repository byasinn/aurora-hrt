import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { playSound } from '../lib/sounds'

// Guia de "coisa nova nessa tela": escurece tudo, deixa só o botão novo iluminado (com um anel
// pulsando) e mostra um balão explicando. Uma vez por guia (localStorage), com Pular. Os alvos são
// marcados no JSX com data-guide="nome"; passo cujo alvo não existe na tela (ex.: sem rotina) é pulado.
// Espera o tour de novidades e os pop-ups do dia (tudo que tem data-overlay) fecharem antes de aparecer.

export interface GuideStep {
  target: string
  title: string
  text: string
}

const KEY = (id: string) => `aurora.guide.${id}`
const PAD = 6

function seen(id: string): boolean {
  try {
    return localStorage.getItem(KEY(id)) === '1'
  } catch {
    return true
  }
}

function markSeen(id: string) {
  try {
    localStorage.setItem(KEY(id), '1')
  } catch {
    // sem storage: pode aparecer de novo, não é grave
  }
}

/** Primeiro elemento visível com esse data-guide (no PC e no celular podem existir dois). */
function findTarget(name: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[data-guide="${name}"]`)
  for (const el of all) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden') return el
  }
  return null
}

export default function Guide({ id, steps, enabled = true }: { id: string; steps: GuideStep[]; enabled?: boolean }) {
  const [active, setActive] = useState<GuideStep[] | null>(null)
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  // a lista de passos é recriada a cada render da tela: a espera depende só dos alvos
  const stepsRef = useRef(steps)
  stepsRef.current = steps
  const stepsKey = steps.map((s) => s.target).join(',')

  // começa quando a tela já montou e não tem nenhum outro pop-up aberto
  useEffect(() => {
    if (!enabled || seen(id)) return
    let tries = 0
    let clear = 0
    const timer = setInterval(() => {
      tries++
      if (tries > 40) return clearInterval(timer) // ~30 s esperando: desiste dessa vez
      if (document.querySelector('[data-overlay]')) {
        clear = 0
        return
      }
      if (++clear < 2) return
      const available = stepsRef.current.filter((s) => findTarget(s.target))
      if (available.length === 0) return
      clearInterval(timer)
      setActive(available)
      setIndex(0)
    }, 750)
    return () => clearInterval(timer)
  }, [id, stepsKey, enabled])

  const step = active?.[index]

  const measure = useCallback(() => {
    if (!step) return
    const el = findTarget(step.target)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [step])

  useLayoutEffect(() => {
    if (!step) return
    const el = findTarget(step.target)
    if (el) {
      const r = el.getBoundingClientRect()
      if (r.top < 80 || r.bottom > window.innerHeight - 140) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
    measure()
    const t = setTimeout(measure, 450) // depois da rolagem suave
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step, measure])

  function finish() {
    markSeen(id)
    setActive(null)
  }

  function next() {
    if (!active) return
    if (index >= active.length - 1) {
      playSound('success')
      finish()
    } else {
      playSound('tap')
      setIndex(index + 1)
    }
  }

  if (!active || !step) return null

  const vw = window.innerWidth
  const vh = window.innerHeight
  const hole = rect
    ? { x: rect.left - PAD, y: rect.top - PAD, w: rect.width + PAD * 2, h: rect.height + PAD * 2 }
    : { x: vw / 2, y: vh / 2, w: 0, h: 0 }
  // balão embaixo do alvo se couber, senão em cima
  const bubbleW = Math.min(320, vw - 24)
  const below = hole.y + hole.h + 190 < vh
  const bubbleTop = hole.y + hole.h + 12
  const bubbleLeft = Math.min(Math.max(12, hole.x + hole.w / 2 - bubbleW / 2), vw - bubbleW - 12)
  const arrowLeft = Math.min(Math.max(18, hole.x + hole.w / 2 - bubbleLeft), bubbleW - 18)

  return createPortal(
    <AnimatePresence>
      <motion.div key={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[97]" data-overlay>
        {/* fundo escuro com o "furo" no alvo */}
        <svg className="absolute inset-0 h-full w-full" onClick={next}>
          <defs>
            <mask id={`guide-hole-${id}`}>
              <rect width="100%" height="100%" fill="white" />
              <motion.rect animate={{ x: hole.x, y: hole.y, width: hole.w, height: hole.h }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} rx={18} fill="black" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(20,10,25,0.62)" mask={`url(#guide-hole-${id})`} />
        </svg>
        <motion.div
          className="pointer-events-none absolute rounded-[18px] border-[3px] border-white"
          animate={{ left: hole.x, top: hole.y, width: hole.w, height: hole.h, boxShadow: ['0 0 0 0 rgba(255,255,255,0.7)', '0 0 0 10px rgba(255,255,255,0)'] }}
          transition={{ boxShadow: { repeat: Infinity, duration: 1.4 }, default: { type: 'spring', stiffness: 300, damping: 30 } }}
        />

        <motion.div
          key={index}
          initial={{ opacity: 0, y: below ? 8 : -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute rounded-2xl bg-[var(--surface)] p-3.5 text-[var(--text)] [box-shadow:0_12px_40px_rgba(0,0,0,0.3)]"
          style={below ? { top: bubbleTop, left: bubbleLeft, width: bubbleW } : { bottom: vh - hole.y + 12, left: bubbleLeft, width: bubbleW }}
        >
          <span
            className="absolute h-3 w-3 rotate-45 bg-[var(--surface)]"
            style={below ? { top: -6, left: arrowLeft - 6 } : { bottom: -6, left: arrowLeft - 6 }}
          />
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[var(--accent-contrast)]">Novo!</span>
            {active.length > 1 && (
              <span className="text-[11px] font-bold text-[var(--text-muted)]">
                {index + 1} de {active.length}
              </span>
            )}
          </div>
          <p className="font-extrabold leading-tight">{step.title}</p>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">{step.text}</p>
          <div className="mt-3 flex items-center justify-between">
            <button onClick={finish} className="text-sm font-bold text-[var(--text-muted)]">
              Pular
            </button>
            <button onClick={next} className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-bold text-[var(--accent-contrast)]">
              {index >= active.length - 1 ? 'Entendi!' : 'Próximo'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}
