import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { playVoice } from '../../lib/sounds'
import type { Department } from './departments'
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
  type Rect,
} from './pixelArt'

// A loja 8-bit: fundo da loja, vendedora atrás do balcão (pisca, mexe a boca e faz "blá-blá"
// enquanto o texto aparece) e o balão de fala. Tocar nela chama `onKeeperClick`.

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

/** Texto aparecendo letra por letra, com "blá-blá" a cada duas letras. */
function useTyping(text: string, voice: number) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    setShown(0)
    let i = 0
    const id = setInterval(() => {
      i++
      setShown(i)
      const ch = text[i - 1]
      if (ch && /[a-zá-úçãõ]/i.test(ch) && i % 2 === 0) playVoice(voice)
      if (i >= text.length) clearInterval(id)
    }, 32)
    return () => clearInterval(id)
  }, [text, voice])
  return { typed: text.slice(0, shown), typing: shown < text.length, tick: shown }
}

export default function ShopStage({
  dept,
  message,
  onKeeperClick,
  idleTalk = true,
  poke = 0,
}: {
  dept: Department
  /** fala fixa (ex.: "O que você procura?"); sem isso ela cumprimenta e solta falas de vez em quando */
  message?: string
  onKeeperClick?: () => void
  idleTalk?: boolean
  /** muda o número pra ela soltar outra fala (ex.: quando tocam nela) */
  poke?: number
}) {
  const { keeper, scene } = dept
  const [line, setLine] = useState(keeper.greeting)
  const [blink, setBlink] = useState(false)
  const idleCount = useRef(0)
  const text = message ?? line
  const { typed, typing, tick } = useTyping(text, keeper.voice)

  // piscadinha: de 2 a 5 segundos, olho fechado por um instante
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

  useEffect(() => {
    if (poke > 0) setLine(keeper.lines[poke % keeper.lines.length])
  }, [poke, keeper.lines])

  // de vez em quando fala alguma coisa sozinha (no máximo 3 vezes por visita, pra não encher)
  useEffect(() => {
    if (!idleTalk || message) return
    const id = setInterval(
      () => {
        if (document.visibilityState !== 'visible' || idleCount.current >= 3) return
        idleCount.current++
        setLine(keeper.lines[Math.floor(Math.random() * keeper.lines.length)])
      },
      17000 + Math.random() * 8000,
    )
    return () => clearInterval(id)
  }, [idleTalk, message, keeper.lines])

  const palette = useMemo(() => keeperPalette(keeper.look), [keeper.look])
  const baseRects = useMemo(() => toRects(keeperBase(keeper.look), palette), [keeper.look, palette])
  const glassesRects = useMemo(() => {
    const g = keeperGlasses(keeper.look)
    return g ? toRects(g, palette) : []
  }, [keeper.look, palette])
  const talking = typing && tick % 4 < 2
  const faceRects = useMemo(() => toRects(keeperFace(blink, talking), palette), [blink, talking, palette])
  const scenePal = useMemo(() => scenePalette(scene), [scene])
  const sceneRects = useMemo(() => toRects(sceneGrid(scene), scenePal, ANIM_CLASSES), [scene, scenePal])
  const counterRects = useMemo(() => toRects(counterGrid(scene), { ...scenePal, ...handPalette(keeper.look) }, ANIM_CLASSES), [scene, scenePal, keeper.look])

  const keeperWidthPct = 38
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
        style={{ left: '5%', bottom: '17%', width: `${keeperWidthPct}%` }}
      >
        <motion.svg
          viewBox={`0 0 ${KEEPER_W} ${KEEPER_H}`}
          className="block h-auto w-full"
          shapeRendering="crispEdges"
          animate={{ y: [0, -2, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        >
          <Pixels rects={baseRects} />
          <Pixels rects={faceRects} />
          <Pixels rects={glassesRects} />
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

      <div className="absolute right-[3%] top-[5%] w-[55%]">
        <div className="relative rounded-2xl border-[3px] border-[#2a1626] bg-white px-2.5 py-2 text-[#2a1626] [box-shadow:0_3px_0_rgba(0,0,0,0.25)]">
          <span className="absolute -left-[9px] top-5 h-3 w-3 rotate-45 border-b-[3px] border-l-[3px] border-[#2a1626] bg-white" />
          <p className="font-pixel min-h-[3.6em] text-[13px] leading-snug">
            {typed}
            {typing && <span className="opacity-40">▌</span>}
          </p>
        </div>
      </div>
    </div>
  )
}
