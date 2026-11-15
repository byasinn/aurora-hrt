import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { Check, ChevronLeft, Flame, Gift, Heart, MessageCircle, Potion, Sparkles } from './icons'
import { Button } from './ui'
import PixelIcon from './PixelIcon'
import { VisualPreview } from './VisualStylePicker'
import { KeeperMini } from '../features/shop/ShopStage'
import { DEPARTMENTS } from '../features/shop/departments'
import { playSound } from '../lib/sounds'

// "O que mudou" em forma de tour: uma tela por novidade, cada uma com uma demonstração animada feita
// com pedacinhos de interface de verdade. Arrasta pro lado, toca em Próximo ou pula tudo. Versões sem
// tour no código continuam mostrando o texto do anúncio (AnnouncementModal).

interface Slide {
  title: string
  text: string
  demo: () => ReactNode
  /** fundo da área da demonstração */
  bg: string
}

// ---------- demonstrações ----------

function useLoop(steps: number, ms: number) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % steps), ms)
    return () => clearInterval(id)
  }, [steps, ms])
  return i
}

function MiniCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('rounded-2xl bg-[var(--surface)] p-2.5 text-left text-[var(--text)] [box-shadow:var(--shadow)]', className)}>{children}</div>
}

function WelcomeDemo() {
  const chips = ['Missões', 'Baús', 'Poções', 'Comunidade', 'Lojinha', '8-bit', 'Semana Perfeita']
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.img
        src="/icons/icon-192.png"
        alt=""
        className="h-16 w-16 rounded-2xl [box-shadow:var(--shadow)]"
        animate={{ y: [0, -6, 0], rotate: [0, -4, 4, 0] }}
        transition={{ repeat: Infinity, duration: 2.4 }}
      />
      <div className="flex max-w-[260px] flex-wrap justify-center gap-1.5">
        {chips.map((c, i) => (
          <motion.span
            key={c}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.12 }}
            className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-bold text-[var(--text)] [box-shadow:var(--shadow)]"
          >
            {c}
          </motion.span>
        ))}
      </div>
    </div>
  )
}

function MissionsDemo() {
  const step = useLoop(4, 1100)
  const rows = [
    { t: 'Registre seu dia', p: 1 },
    { t: 'Conclua uma rotina', p: step >= 1 ? 1 : 0.4 },
    { t: 'Interaja 3 vezes', p: step >= 2 ? 1 : 0.33 },
  ]
  return (
    <div className="flex w-full max-w-[290px] items-center gap-3">
      <div className="flex-1 space-y-1.5">
        {rows.map((r) => (
          <MiniCard key={r.t} className="p-2">
            <p className="text-[11px] font-bold">{r.t}</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <motion.div className="h-full rounded-full bg-[var(--accent)]" animate={{ width: `${r.p * 100}%` }} transition={{ duration: 0.5 }} />
            </div>
          </MiniCard>
        ))}
      </div>
      <div className="relative flex w-20 flex-col items-center">
        <motion.div animate={step === 3 ? { rotate: [0, -12, 12, -6, 0], scale: [1, 1.15, 1] } : { rotate: [0, -3, 3, 0] }} transition={{ duration: 0.6 }}>
          <Gift size={52} />
        </motion.div>
        <AnimatePresence>
          {step === 3 && (
            <motion.span
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -18 }}
              exit={{ opacity: 0 }}
              className="absolute -top-2 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-white"
            >
              +25 <Potion size={14} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function PointsDemo() {
  const step = useLoop(9, 520)
  const days = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
  const filled = Math.min(step, 7)
  return (
    <div className="w-full max-w-[290px] space-y-2">
      <MiniCard>
        <p className="text-[11px] font-bold text-[var(--text-muted)]">🎯 Semana Perfeita · Beber água</p>
        <div className="mt-1.5 grid grid-cols-7 gap-1">
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-[var(--text-muted)]">{d}</span>
              <motion.span
                className="flex h-7 w-full items-center justify-center rounded-lg"
                animate={{ backgroundColor: i < filled ? 'var(--accent)' : 'var(--surface-2)', scale: i === filled - 1 ? [1, 1.15, 1] : 1 }}
              >
                {i < filled && <Check size={12} className="text-[var(--accent-contrast)]" />}
              </motion.span>
            </div>
          ))}
        </div>
      </MiniCard>
      <AnimatePresence>
        {filled === 7 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-center gap-1.5">
            <span className="rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-white">+50% no domingo!</span>
            <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-bold text-[var(--text)]">💊 +20 remédios em dia</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function YesterdayDemo() {
  const step = useLoop(4, 900)
  const items = ['Glúteo A · treino', 'Beber água · rotina']
  return (
    <MiniCard className="w-full max-w-[270px] space-y-1.5">
      <p className="text-[10px] font-bold uppercase text-[var(--accent)]">E ontem?</p>
      <p className="text-sm font-extrabold">Você fez isso ontem?</p>
      {items.map((t, i) => {
        const on = step > i
        return (
          <div key={t} className={clsx('flex items-center gap-2 rounded-xl border px-2 py-1.5 text-xs transition', on ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)]')}>
            <span className={clsx('flex h-4 w-4 items-center justify-center rounded-full border', on ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]' : 'border-[var(--border)]')}>
              {on && <Check size={9} />}
            </span>
            {t}
          </div>
        )
      })}
      <p className="text-[10px] text-[var(--text-muted)]">E as doses esquecidas dos últimos 10 dias, por remédio.</p>
    </MiniCard>
  )
}

function CommunityDemo() {
  const step = useLoop(6, 700)
  return (
    <div className="w-full max-w-[280px] space-y-2">
      {[
        { t: 'Alguém usa gel de estradiol?', tags: ['Hormônios', 'Dúvidas'] },
        { t: 'Hoje fez 1 ano de HRT! 💖', tags: ['Conquistas'] },
      ].map((topic, i) => (
        <motion.div key={topic.t} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.25 }}>
          <MiniCard>
            <p className="text-xs font-extrabold">{topic.t}</p>
            <div className="mt-1 flex items-center gap-1">
              {topic.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-[var(--border)] px-1.5 text-[9px] font-bold text-[var(--text-muted)]">
                  {tag}
                </span>
              ))}
              <span className="flex-1" />
              <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
                <Heart size={10} /> {i === 0 ? 3 + step : 12 + step * 2}
              </span>
              <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
                <MessageCircle size={10} /> {i === 0 ? 1 + Math.floor(step / 2) : 5 + step}
              </span>
            </div>
          </MiniCard>
        </motion.div>
      ))}
    </div>
  )
}

function ShopDemo() {
  const blink = useLoop(8, 450) === 0
  const dept = DEPARTMENTS.find((d) => d.slug === 'pocoes') ?? DEPARTMENTS[0]
  return (
    <div className="w-full max-w-[290px] space-y-2">
      <KeeperMini dept={dept} talk={{ typed: 'Psiu! Hoje tem oferta do dia, hihi!', typing: false, blink, talking: false }} />
      <MiniCard className="flex items-center gap-2 p-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-2)]">
          <Sparkles size={16} className="text-[var(--accent)]" />
        </span>
        <span className="flex-1 text-xs font-bold">Moldura Neon</span>
        <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">-10% HOJE</span>
      </MiniCard>
    </div>
  )
}

function CustomizeDemo() {
  const pixel = useLoop(2, 1600) === 1
  return (
    <div className="w-full max-w-[220px]">
      <AnimatePresence mode="wait">
        <motion.div key={pixel ? 'p' : 'c'} initial={{ opacity: 0, rotateY: 80 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0, rotateY: -80 }} transition={{ duration: 0.35 }}>
          <VisualPreview value={pixel ? 'pixel' : 'classic'} />
        </motion.div>
      </AnimatePresence>
      <p className="mt-2 text-center text-xs font-bold text-[var(--text)]">{pixel ? 'Visual 8-bit' : 'Visual Clean'}</p>
    </div>
  )
}

function WorkoutDemo() {
  const step = useLoop(6, 600)
  return (
    <MiniCard className="w-full max-w-[260px] space-y-2">
      <p className="text-sm font-extrabold">Agachamento</p>
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            animate={{ backgroundColor: step > i ? 'var(--accent)' : 'var(--surface-2)', scale: step === i + 1 ? [1, 1.2, 1] : 1 }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-[var(--text-muted)]"
          >
            {step > i ? <Check size={14} className="text-[var(--accent-contrast)]" /> : i + 1}
          </motion.span>
        ))}
      </div>
      <p className="text-[10px] text-[var(--text-muted)]">Sem kg nem repetição — só marcar as séries.</p>
    </MiniCard>
  )
}

function StreakDemo() {
  const step = useLoop(8, 600)
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div key={step} initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] [box-shadow:var(--shadow)]">
        <Flame size={36} className="text-orange-500" />
      </motion.div>
      <p className="font-pixel text-3xl font-bold text-[var(--text)]">{7 + (step % 3)}</p>
      <div className="flex gap-1">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className={clsx('flex h-7 w-7 items-center justify-center rounded-lg text-xs', i === 3 ? 'bg-sky-400/20 font-bold text-sky-500' : 'bg-orange-500/15')}>
            {i === 3 ? 'zZ' : <PixelIcon name="flame" size={14} />}
          </span>
        ))}
      </div>
    </div>
  )
}

// ---------- tours por versão ----------

export const TOURS: Record<string, Slide[]> = {
  '1.3.0': [
    {
      title: 'O Aurora mudou bastante!',
      text: 'Missões, baús, poções, Comunidade nova, lojinha e visual 8-bit. Vem ver rapidinho — ou pula, se preferir.',
      demo: () => <WelcomeDemo />,
      bg: 'linear-gradient(140deg, var(--accent-soft), var(--surface-2))',
    },
    {
      title: 'Missões e baús',
      text: 'No botão do Aurora: missões de boas-vindas, diárias e semanais. Complete, pegue o baú e abra — tem Brilho, itens e poções.',
      demo: () => <MissionsDemo />,
      bg: 'linear-gradient(140deg, #fde68a55, var(--accent-soft))',
    },
    {
      title: 'Streak com folga',
      text: 'Abrir o app todo dia mantém seu streak. A cada 7 dias: baú raro e um dia de folga que segura o streak se você esquecer.',
      demo: () => <StreakDemo />,
      bg: 'linear-gradient(140deg, #fed7aa66, var(--surface-2))',
    },
    {
      title: 'Brilho novo e Semana Perfeita',
      text: 'Remédio e treino valem por semana completa. Rotina vale por dia — ou na Semana Perfeita, +50% no domingo se fizer todo dia.',
      demo: () => <PointsDemo />,
      bg: 'linear-gradient(140deg, var(--accent-soft), #bbf7d055)',
    },
    {
      title: 'E ontem, fez?',
      text: 'Esqueceu de marcar? Ao abrir o app ele pergunta. Marcado depois fica no histórico; uma Poção do tempo faz valer Brilho.',
      demo: () => <YesterdayDemo />,
      bg: 'linear-gradient(140deg, #c4b5fd55, var(--surface-2))',
    },
    {
      title: 'Comunidade em tópicos',
      text: 'Abra um tópico com tags, veja os mais recentes ou os mais relevantes e filtre por assunto.',
      demo: () => <CommunityDemo />,
      bg: 'linear-gradient(140deg, #bae6fd66, var(--accent-soft))',
    },
    {
      title: 'Lojinha nova',
      text: 'Departamentos, ofertas do dia, bandeiras novas e uma loja de poções. No 8-bit, cada loja tem sua vendedora.',
      demo: () => <ShopDemo />,
      bg: 'linear-gradient(140deg, #ddd6fe66, #fbcfe866)',
    },
    {
      title: 'Do seu jeito',
      text: 'Em Personalizar app (no Aurora): tema, moldura, borda, calendário e o visual Clean ou 8-bit.',
      demo: () => <CustomizeDemo />,
      bg: 'linear-gradient(140deg, var(--surface-2), var(--accent-soft))',
    },
    {
      title: 'Treinos mais simples',
      text: 'Só o nome do exercício e as séries pra marcar. "Concluir treino" marca tudo.',
      demo: () => <WorkoutDemo />,
      bg: 'linear-gradient(140deg, #bbf7d055, var(--surface-2))',
    },
  ],
}

export default function WhatsNewTour({ version, slides, onClose }: { version: string; slides: Slide[]; onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1)
  const slide = slides[index]
  const last = index === slides.length - 1

  function go(next: number) {
    if (next < 0 || next >= slides.length) return
    playSound('tap')
    setDir(next > index ? 1 : -1)
    setIndex(next)
  }

  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[96] flex items-end justify-center bg-black/50 p-3 sm:items-center">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-[var(--surface)] [box-shadow:0_20px_60px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--accent)]">Novidades · {version}</span>
          {!last && (
            <button onClick={onClose} className="rounded-full px-2 py-1 text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
              Pular
            </button>
          )}
        </div>

        <div className="relative h-[330px] overflow-hidden">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={index}
              custom={dir}
              initial={{ x: dir * 280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: dir * -280, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.4}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) go(index + 1)
                else if (info.offset.x > 60) go(index - 1)
              }}
              className="absolute inset-0 flex cursor-grab flex-col px-4 pt-2 active:cursor-grabbing"
            >
              <div className="flex h-48 shrink-0 items-center justify-center rounded-2xl px-3" style={{ background: slide.bg }}>
                {slide.demo()}
              </div>
              <h2 className="mt-3 text-xl font-extrabold leading-tight text-[var(--text)]">{slide.title}</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{slide.text}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3 px-4 pb-4 pt-1">
          <button
            onClick={() => go(index - 1)}
            aria-label="Voltar"
            className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)]', index === 0 && 'invisible')}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex flex-1 justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Novidade ${i + 1}`}
                onClick={() => go(i)}
                className={clsx('h-2 rounded-full transition-all', i === index ? 'w-6 bg-[var(--accent)]' : 'w-2 bg-[var(--border)]')}
              />
            ))}
          </div>
          <Button className="shrink-0 !px-5" onClick={() => (last ? (playSound('success'), onClose()) : go(index + 1))}>
            {last ? 'Bora!' : 'Próximo'}
          </Button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
