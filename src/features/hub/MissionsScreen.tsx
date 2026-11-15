import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { ArrowLeft, Check, ChevronRight, Coins, Flame, Gift, Lock, Potion, Target, X } from '../../components/icons'
import { Button, Card } from '../../components/ui'
import { useClaimMission, useMissions, useOpenChest, useUsePotion } from '../../api/points'
import { chestLabel, rewardLabel, type ChestView, type MissionState, type StreakDay } from '../../../shared/missions'
import { BACKFILL_DAYS, addDays } from '../../../shared/points'
import { SHOP_ITEM_BY_KEY } from '../../../shared/shopCatalog'
import { playSound } from '../../lib/sounds'
import { toastError } from '../../lib/toast'
import Guide from '../../components/Guide'

function MissionRow({ mission, locked }: { mission: MissionState; locked?: boolean }) {
  const claim = useClaimMission()
  const complete = mission.progress >= mission.target
  const pct = Math.round((mission.progress / mission.target) * 100)
  const RewardIcon = mission.rewardKind === 'potion' ? Potion : mission.rewardKind === 'brilho' ? Coins : Gift

  return (
    <div
      className={clsx(
        'flex items-center gap-3 rounded-2xl border p-3',
        locked || mission.claimed ? 'border-[var(--border)] opacity-60' : complete ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)]',
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)]">
        {mission.claimed ? (
          <Check size={20} className="text-[var(--accent)]" />
        ) : locked ? (
          <Lock size={18} className="text-[var(--text-muted)]" />
        ) : (
          <RewardIcon size={mission.rewardKind === 'chest' ? 26 : 20} className={mission.rewardKind === 'brilho' ? 'text-amber-500' : undefined} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight">{mission.title}</p>
        {mission.description && <p className="text-xs text-[var(--text-muted)]">{mission.description}</p>}
        <p className="text-[11px] font-bold text-[var(--accent)]">{rewardLabel(mission)}</p>
        {!mission.claimed && !locked && mission.target > 1 && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              {mission.progress}/{mission.target}
            </span>
          </div>
        )}
      </div>
      {mission.claimed ? (
        <span className="text-xs text-[var(--text-muted)]">feito</span>
      ) : locked ? null : complete ? (
        <Button
          className="shrink-0 !px-3 !py-2 text-sm"
          disabled={claim.isPending}
          onClick={() =>
            claim.mutate(mission.key, {
              onSuccess: () => playSound(mission.rewardKind === 'chest' ? 'success' : 'coin'),
              onError: (e) => toastError(e),
            })
          }
        >
          {mission.rewardKind === 'chest' ? 'Pegar baú' : 'Pegar'}
        </Button>
      ) : (
        <Link to={mission.to} className="shrink-0 p-1 text-[var(--text-muted)]" aria-label="Ir fazer">
          <ChevronRight size={18} />
        </Link>
      )}
    </div>
  )
}

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const STATUS_LABEL: Record<StreakDay['status'], string> = {
  fire: 'Abriu o app',
  rest: 'Folga',
  missed: 'Perdido',
  pending: 'Hoje — ainda dá tempo',
  none: '',
  future: '',
}

/** A semana do streak de comprido: fogo = abriu, zZ = folga (o app cobriu o dia), X = perdido. */
function StreakWeek({ days, streak, restDaysLeft }: { days: StreakDay[]; streak: number; restDaysLeft: number }) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 font-bold">
          <Flame size={18} className="text-orange-500" /> {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}
        </p>
        <span className="text-xs text-[var(--text-muted)]">
          zZ {restDaysLeft} {restDaysLeft === 1 ? 'folga guardada' : 'folgas guardadas'}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const wd = new Date(`${d.date}T12:00:00`).getDay()
          return (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <span className="text-[11px] text-[var(--text-muted)]">{WEEKDAY_SHORT[wd]}</span>
              <span
                className={clsx(
                  'flex h-10 w-full items-center justify-center rounded-xl',
                  d.status === 'fire' && 'bg-orange-500/15',
                  d.status === 'rest' && 'bg-sky-400/15',
                  d.status === 'missed' && 'bg-[var(--surface-2)]',
                  d.status === 'pending' && 'border-2 border-dashed border-orange-400/70',
                  (d.status === 'future' || d.status === 'none') && 'bg-[var(--surface-2)] opacity-50',
                )}
                title={STATUS_LABEL[d.status]}
              >
                {d.status === 'fire' ? (
                  <Flame size={20} className="text-orange-500" />
                ) : d.status === 'rest' ? (
                  <span className="text-sm font-bold text-sky-500">zZ</span>
                ) : d.status === 'missed' ? (
                  <X size={16} className="text-[var(--text-muted)]" />
                ) : null}
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-[var(--text-muted)]">
        A cada 7 dias seguidos você ganha um baú raro e 1 dia de folga (guarda até 2): se um dia não der pra abrir o app, a folga cobre e o streak
        não quebra.
      </p>
    </Card>
  )
}

function ChestContentsView({ chest }: { chest: ChestView }) {
  if (!chest.contents) return null
  const item = chest.contents.itemKey ? SHOP_ITEM_BY_KEY.get(chest.contents.itemKey) : null
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <span className="flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-3 py-1 text-sm font-bold">
        <Coins size={14} className="text-amber-500" /> +{chest.contents.brilho}
      </span>
      {chest.contents.potions > 0 && (
        <span className="flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-3 py-1 text-sm font-bold">
          <Potion size={16} /> +{chest.contents.potions} poção
        </span>
      )}
      {item && <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-sm font-bold text-[var(--accent-contrast)]">{item.name}</span>}
    </div>
  )
}

function OpenChestModal({ chest, onClose }: { chest: ChestView; onClose: () => void }) {
  const item = chest.contents?.itemKey ? SHOP_ITEM_BY_KEY.get(chest.contents.itemKey) : null
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-xs">
        <Card className="space-y-4 text-center">
          <motion.div initial={{ rotate: -10, scale: 0.6 }} animate={{ rotate: [0, -8, 8, -4, 0], scale: 1 }} transition={{ duration: 0.6 }} className="mx-auto w-fit">
            <Gift size={72} />
          </motion.div>
          <div>
            <p className="text-lg font-extrabold">{chest.rarity === 'rare' ? 'Baú raro!' : 'Baú aberto!'}</p>
            <p className="text-xs text-[var(--text-muted)]">{chestLabel(chest.source)}</p>
          </div>
          <ChestContentsView chest={chest} />
          {item && (
            <p className="text-xs text-[var(--text-muted)]">
              O item já está em <Link to="/meus-itens" className="font-bold text-[var(--accent)]">Meus itens</Link>.
            </p>
          )}
          <Button className="w-full" onClick={onClose}>
            Oba!
          </Button>
        </Card>
      </motion.div>
    </motion.div>,
    document.body,
  )
}

function PotionCard({ potions, rescued, today }: { potions: number; rescued: string[]; today: string }) {
  const use = useUsePotion()
  const [picking, setPicking] = useState(false)
  const days = Array.from({ length: BACKFILL_DAYS }, (_, i) => addDays(today, -(i + 1))).filter((d) => !rescued.includes(d))

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-3">
        <Potion size={34} />
        <div className="min-w-0 flex-1">
          <p className="font-bold">Poções do tempo: {potions}</p>
          <p className="text-xs text-[var(--text-muted)]">
            Salvam um dia esquecido (até {BACKFILL_DAYS} dias atrás): o que você marcou depois naquele dia passa a valer Brilho e o dia conta pro streak.
          </p>
        </div>
      </div>
      {potions > 0 &&
        (!picking ? (
          <Button variant="secondary" className="w-full" onClick={() => setPicking(true)}>
            Usar uma poção
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-bold">Qual dia salvar?</p>
            <div className="flex flex-wrap gap-1.5">
              {days.map((d) => (
                <button
                  key={d}
                  disabled={use.isPending}
                  onClick={() => {
                    if (!confirm(`Usar uma poção em ${new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}?`)) return
                    use.mutate(d, {
                      onSuccess: () => {
                        playSound('success')
                        setPicking(false)
                      },
                      onError: (e) => toastError(e),
                    })
                  }}
                  className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs"
                >
                  {new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </button>
              ))}
            </div>
            <button onClick={() => setPicking(false)} className="text-xs text-[var(--text-muted)]">
              Cancelar
            </button>
          </div>
        ))}
    </Card>
  )
}

type Tab = 'daily' | 'weekly' | 'quests'
const TABS: { key: Tab; label: string }[] = [
  { key: 'daily', label: 'Diário' },
  { key: 'weekly', label: 'Semanal' },
  { key: 'quests', label: 'Quests' },
]

export default function MissionsScreen() {
  const { data, isLoading } = useMissions()
  const open = useOpenChest()
  const [opened, setOpened] = useState<ChestView | null>(null)
  const [tab, setTab] = useState<Tab>('daily')

  const missions = data?.missions ?? []
  const starter = missions.filter((m) => m.group === 'starter')
  const daily = missions.filter((m) => m.group === 'daily' && !m.hidden)
  const weekly = missions.filter((m) => m.group === 'weekly' && !m.hidden)
  const welcomeDone = !!data?.dailyUnlocked
  const closed = data?.chests ?? []
  const readyIn = (list: MissionState[]) => list.filter((m) => !m.claimed && m.progress >= m.target).length
  const badge: Record<Tab, number> = {
    daily: readyIn(starter) + (welcomeDone ? readyIn(daily) : 0),
    weekly: readyIn(weekly),
    quests: 0,
  }

  function openChest(chest: ChestView) {
    open.mutate(chest.id, {
      onSuccess: (c) => {
        playSound('coin')
        setOpened(c)
      },
      onError: (e) => toastError(e),
    })
  }

  return (
    <div className="space-y-5">
      <Guide
        id="missions-1.3"
        steps={[
          { target: 'missions-counters', title: 'Streak e poções', text: 'O foguinho é seu streak. A poção salva um dia que você esqueceu de marcar.' },
          { target: 'missions-tabs', title: 'Diário, Semanal e Quests', text: 'As boas-vindas liberam as diárias; as semanais renovam toda segunda.' },
        ]}
      />
      <Link to="/aurora" className="flex items-center gap-1 pt-2 text-sm text-[var(--text-muted)]">
        <ArrowLeft size={16} /> Aurora
      </Link>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Missões</h1>
          <p className="text-sm text-[var(--text-muted)]">Complete, pegue a recompensa e abra.</p>
        </div>
        <div className="flex gap-2" data-guide="missions-counters">
          <span className="flex items-center gap-1 rounded-full bg-[var(--surface)] px-3 py-1.5 [box-shadow:var(--shadow)]">
            <Flame size={16} className="text-orange-500" />
            <span className="font-pixel text-lg font-bold">{data?.streak ?? '–'}</span>
          </span>
          <span className="flex items-center gap-1 rounded-full bg-[var(--surface)] px-3 py-1.5 [box-shadow:var(--shadow)]">
            <Potion size={18} />
            <span className="font-pixel text-lg font-bold">{data?.potions ?? '–'}</span>
          </span>
        </div>
      </div>

      {closed.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">Baús pra abrir</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {closed.map((c) => (
              <motion.button
                key={c.id}
                whileTap={{ scale: 0.94 }}
                animate={{ rotate: [0, -3, 3, 0] }}
                transition={{ repeat: Infinity, repeatDelay: 2, duration: 0.5 }}
                onClick={() => openChest(c)}
                disabled={open.isPending}
                className={clsx(
                  'flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center',
                  c.rarity === 'rare' ? 'border-amber-400 bg-amber-400/10' : 'border-[var(--accent)] bg-[var(--accent-soft)]',
                )}
              >
                <Gift size={44} />
                <span className="text-xs font-bold">{c.rarity === 'rare' ? 'Baú raro' : 'Baú'}</span>
                <span className="line-clamp-1 text-[11px] text-[var(--text-muted)]">{chestLabel(c.source)}</span>
                <span className="text-xs font-bold text-[var(--accent)]">Abrir</span>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-[var(--surface-2)] p-1" data-guide="missions-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              playSound('tap')
              setTab(t.key)
            }}
            className={clsx(
              'relative min-h-10 rounded-xl text-sm font-bold transition',
              tab === t.key ? 'bg-[var(--surface)] text-[var(--text)] [box-shadow:var(--shadow)]' : 'text-[var(--text-muted)]',
            )}
          >
            {t.label}
            {badge[t.key] > 0 && (
              <span className="absolute -top-1 right-1 rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-5 text-white">{badge[t.key]}</span>
            )}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}

      {tab === 'daily' && data && (
        <>
          {!welcomeDone && (
            <section className="space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">Boas-vindas</h2>
              {starter.map((m) => (
                <MissionRow key={m.key} mission={m} />
              ))}
            </section>
          )}
          <section className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">Missões de hoje</h2>
              <span className="text-xs text-[var(--text-muted)]">renovam todo dia</span>
            </div>
            {!welcomeDone && (
              <p className="flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-muted)]">
                <Lock size={14} /> Complete as boas-vindas pra liberar as missões diárias.
              </p>
            )}
            {daily.map((m) => (
              <MissionRow key={m.key} mission={m} locked={!welcomeDone} />
            ))}
            {daily.length === 0 && <p className="text-sm text-[var(--text-muted)]">Nenhuma missão diária agora.</p>}
          </section>
        </>
      )}

      {tab === 'weekly' && data && (
        <>
          <StreakWeek days={data.streakWeek} streak={data.streak} restDaysLeft={data.restDaysLeft} />
          <section className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">Da semana</h2>
              <span className="text-xs text-[var(--text-muted)]">renovam toda segunda</span>
            </div>
            {weekly.map((m) => (
              <MissionRow key={m.key} mission={m} />
            ))}
          </section>
          <PotionCard potions={data.potions} rescued={data.rescued} today={data.today} />
        </>
      )}

      {tab === 'quests' && (
        <Card className="space-y-3 py-8 text-center">
          <Target size={44} className="mx-auto text-[var(--accent)]" />
          <p className="text-lg font-extrabold">Quests chegando em breve</p>
          <p className="mx-auto max-w-xs text-sm text-[var(--text-muted)]">
            Missões maiores, em etapas, com recompensas exclusivas que não tem na lojinha. Fica de olho!
          </p>
        </Card>
      )}

      <AnimatePresence>{opened && <OpenChestModal chest={opened} onClose={() => setOpened(null)} />}</AnimatePresence>
    </div>
  )
}
