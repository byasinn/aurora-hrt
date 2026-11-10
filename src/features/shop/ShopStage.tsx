import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { playVoice } from '../../lib/sounds'
import type { Department, Keeper } from './departments'
import {
  COUNTER_H,
  KEEPER_H,
  KEEPER_W,
  SCENE_H,
  SCENE_W,
  counterGrid,
  handPalette,
  keeperBase,
  keeperFace,
  keeperGlasses,
  keeperPalette,
  sceneGrid,
  scenePalette,
  toRects,
  type KeeperLook,
  type Rect,
} from './pixelArt'

// A loja 8-bit: fundo da loja, vendedora atrás do balcão (pisca, mexe a boca e faz "blá-blá"
// enquanto o texto aparece) e o balão de fala. A fala mora num hook só (useKeeperTalk) que alimenta
// a cena grande e a barrinha que fica presa no topo quando a cena sai da tela — assim ela nunca fala
// em dobro.

const ANIM_CLASSES = { twinkle: 'pixel-twinkle', flame: 'pixel-flicker', flameHi: 'pixel-flicker' }

function Pixels({ rects }: { rects: Rect[] }) {
  return (
    <>
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} className={r.cls} />
      ))}
    </>
  )
}

export interface KeeperTalk {
  typed: string
  typing: boolean
  blink: boolean
  /** boca aberta agora (alterna enquanto o texto aparece) */
  talking: boolean
}

/**
 * Fala da vendedora: cumprimenta, comenta a promoção da loja (se tiver), solta uma fala quando
 * tocam nela (`poke`) e de vez em quando sozinha (até 3 por visita). `message` fixa uma fala.
 */
export function useKeeperTalk({
  keeper,
  message,
  poke = 0,
  promoLine,
}: {
  keeper: Keeper
  message?: string
  poke?: number
  promoLine?: string | null
}): KeeperTalk {
  const [line, setLine] = useState(keeper.greeting)
  const [blink, setBlink] = useState(false)
  const [shown, setShown] = useState(0)
  const idleCount = useRef(0)
  const pool = useMemo(() => (promoLine ? [promoLine, ...keeper.lines] : keeper.lines), [promoLine, keeper.lines])
  const text = message ?? line

  // depois do oi, conta da promoção
  useEffect(() => {
    if (!promoLine) return
    const t = setTimeout(() => setLine(promoLine), 5500)
    return () => clearTimeout(t)
  }, [promoLine])

  useEffect(() => {
    if (poke > 0) setLine(pool[poke % pool.length])
  }, [poke, pool])

  useEffect(() => {
    if (message) return
    const id = setInterval(
      () => {
        if (document.visibilityState !== 'visible' || idleCount.current >= 3) return
        idleCount.current++
        setLine(pool[Math.floor(Math.random() * pool.length)])
      },
      17000 + Math.random() * 8000,
    )
    return () => clearInterval(id)
  }, [message, pool])

  // texto aparecendo letra por letra, "blá-blá" a cada duas letras
  useEffect(() => {
    setShown(0)
    let i = 0
    const id = setInterval(() => {
      i++
      setShown(i)
      const ch = text[i - 1]
      if (ch && /[a-zá-úçãõ]/i.test(ch) && i % 2 === 0) playVoice(keeper.voice)
      if (i >= text.length) clearInterval(id)
    }, 32)
    return () => clearInterval(id)
  }, [text, keeper.voice])

  // piscadinha a cada 2–5 s
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const schedule = () => {
      t = setTimeout(
        () => {
          setBlink(true)
          setTimeout(() => setBlink(false), 150)
          schedule()
        },
        2000 + Math.random() * 3000,
      )
    }
    schedule()
    return () => clearTimeout(t)
  }, [])

  const typing = shown < text.length
  return { typed: text.slice(0, shown), typing, blink, talking: typing && shown % 4 < 2 }
}

function KeeperPixels({ look, talk }: { look: KeeperLook; talk: KeeperTalk }) {
  const palette = useMemo(() => keeperPalette(look), [look])
  const base = useMemo(() => toRects(keeperBase(look), palette), [look, palette])
  const glasses = useMemo(() => {
    const g = keeperGlasses(look)
    return g ? toRects(g, palette) : []
  }, [look, palette])
  const face = useMemo(() => toRects(keeperFace(talk.blink, talk.talking), palette), [talk.blink, talk.talking, palette])
  return (
    <>
      <Pixels rects={base} />
      <Pixels rects={face} />
      <Pixels rects={glasses} />
    </>
  )
}

function Bubble({ talk, minLines, clamp }: { talk: KeeperTalk; minLines?: boolean; clamp?: boolean }) {
  return (
    <div className="relative min-w-0 flex-1 rounded-2xl border-[3px] border-[#2a1626] bg-white px-2.5 py-2 text-[#2a1626] [box-shadow:0_3px_0_rgba(0,0,0,0.25)]">
      <span className="absolute -left-[9px] top-4 h-3 w-3 rotate-45 border-b-[3px] border-l-[3px] border-[#2a1626] bg-white" />
      <p className={'font-pixel text-[13px] leading-snug ' + (minLines ? 'min-h-[3.6em] ' : '') + (clamp ? 'line-clamp-3' : '')}>
        {talk.typed}
        {talk.typing && <span className="opacity-40">▌</span>}
      </p>
    </div>
  )
}

export default function ShopStage({ dept, talk, onKeeperClick }: { dept: Department; talk: KeeperTalk; onKeeperClick?: () => void }) {
  const { keeper, scene } = dept
  const scenePal = useMemo(() => scenePalette(scene), [scene])
  const sceneRects = useMemo(() => toRects(sceneGrid(scene), scenePal, ANIM_CLASSES), [scene, scenePal])
  const counterRects = useMemo(
    () => toRects(counterGrid(scene), { ...scenePal, ...handPalette(keeper.look) }, ANIM_CLASSES),
    [scene, scenePal, keeper.look],
  )

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border-4 border-[var(--text)] [box-shadow:var(--shadow)]"
      style={{ aspectRatio: `${SCENE_W} / ${SCENE_H}` }}
    >
      <svg viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} className="absolute inset-0 h-full w-full" shapeRendering="crispEdges" preserveAspectRatio="none" aria-hidden>
        <Pixels rects={sceneRects} />
      </svg>

      <button
        type="button"
        onClick={onKeeperClick}
        aria-label={`Falar com ${keeper.name}`}
        className="absolute block cursor-pointer"
        style={{ left: '5%', bottom: '17%', width: '38%' }}
      >
        <motion.svg
          viewBox={`0 0 ${KEEPER_W} ${KEEPER_H}`}
          className="block h-auto w-full"
          shapeRendering="crispEdges"
          animate={{ y: [0, -2, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        >
          <KeeperPixels look={keeper.look} talk={talk} />
        </motion.svg>
      </button>

      <svg
        viewBox={`0 0 ${SCENE_W} ${COUNTER_H}`}
        className="pointer-events-none absolute inset-x-0 bottom-0 w-full"
        style={{ height: `${(COUNTER_H / SCENE_H) * 100}%` }}
        shapeRendering="crispEdges"
        preserveAspectRatio="none"
        aria-hidden
      >
        <Pixels rects={counterRects} />
      </svg>

      {/* plaquinha com o nome, em cima do balcão */}
      <span className="font-pixel pointer-events-none absolute bottom-[4%] left-[5%] rounded-md bg-black/55 px-2 py-0.5 text-[11px] leading-tight text-white">
        {keeper.name} · {keeper.role}
      </span>

      <div className="absolute right-[3%] top-[5%] flex w-[55%]">
        <Bubble talk={talk} minLines />
      </div>
    </div>
  )
}

/** Versão pequena, presa no topo quando a cena grande sai da tela: só o rosto e o balão. */
export function KeeperMini({ dept, talk, onClick, children }: { dept: Department; talk: KeeperTalk; onClick?: () => void; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border-[3px] border-[#2a1626] p-2 [box-shadow:0_6px_18px_rgba(0,0,0,0.18)]" style={{ background: dept.scene.wall }}>
      <div className="flex items-start gap-2">
        <button type="button" onClick={onClick} aria-label={`Falar com ${dept.keeper.name}`} className="shrink-0">
          {/* recorte da cabeça (com chapéu) */}
          <svg viewBox="3 0 34 36" className="block h-16 w-[60px]" shapeRendering="crispEdges">
            <KeeperPixels look={dept.keeper.look} talk={talk} />
          </svg>
        </button>
        <Bubble talk={talk} clamp />
      </div>
      {children}
    </div>
  )
}
