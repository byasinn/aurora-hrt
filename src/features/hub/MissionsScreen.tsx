import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { ArrowLeft, Check, ChevronRight, Coins, Flame, Gift, Potion, Target } from '../../components/icons'
import { Button, Card } from '../../components/ui'
import { useClaimMission, useMissions, useOpenChest, useUsePotion } from '../../api/points'
import { chestLabel, type ChestView, type MissionState } from '../../../shared/missions'
import { BACKFILL_DAYS, addDays } from '../../../shared/points'
import { SHOP_ITEM_BY_KEY } from '../../../shared/shopCatalog'
import { playSound } from '../../lib/sounds'
import { toastError } from '../../lib/toast'

function MissionRow({ mission }: { mission: MissionState }) {
  const claim = useClaimMission()
  const complete = mission.progress >= mission.target
  const pct = Math.round((mission.progress / mission.target) * 100)

  return (
    <div className={clsx('flex items-center gap-3 rounded-2xl border p-3', mission.claimed ? 'border-[var(--border)] opacity-60' : complete ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)]')}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)]">
        {mission.claimed ? <Check size={20} className="text-[var(--accent)]" /> : <Gift size={26} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight">{mission.title}</p>
        <p className="text-xs text-[var(--text-muted)]">{mission.description}</p>
        {!mission.claimed && mission.target > 1 && (
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
      ) : complete ? (
        <Button
          className="shrink-0 !px-3 !py-2 text-sm"
          disabled={claim.isPending}
          onClick={() =>
            claim.mutate(mission.key, {
              onSuccess: () => playSound('success'),
              onError: (e) => toastError(e),
            })
          }
        >
          Pegar baú
        </Button>
      ) : (
        <Link to={mission.to} className="shrink-0 p-1 text-[var(--text-muted)]" aria-label="Ir fazer">
          <ChevronRight size={18} />
        </Link>
      )}
    </div>
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

export default function MissionsScreen() {
  const { data, isLoading } = useMissions()
  const open = useOpenChest()
  const [opened, setOpened] = useState<ChestView | null>(null)

  const missions = data?.missions ?? []
  const starter = missions.filter((m) => m.group === 'starter')
  const weekly = missions.filter((m) => m.group === 'weekly' && !m.hidden)
  const starterAllClaimed = starter.length > 0 && starter.every((m) => m.claimed)
  const closed = (data?.chests ?? []).filter((c) => !c.openedAt)
  const recent = (data?.chests ?? []).filter((c) => c.openedAt).slice(0, 6)

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
      <Link to="/aurora" className="flex items-center gap-1 pt-2 text-sm text-[var(--text-muted)]">
        <ArrowLeft size={16} /> Aurora
      </Link>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Missões</h1>
          <p className="text-sm text-[var(--text-muted)]">Complete, pegue o baú e abra.</p>
        </div>
        <div className="flex gap-2">
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

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}

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

      {!starterAllClaimed && starter.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">Começando</h2>
          {starter.map((m) => (
            <MissionRow key={m.key} mission={m} />
          ))}
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">Da semana</h2>
          <span className="text-xs text-[var(--text-muted)]">renovam toda segunda</span>
        </div>
        {weekly.map((m) => (
          <MissionRow key={m.key} mission={m} />
        ))}
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] p-3">
          <Flame size={26} className="shrink-0 text-orange-500" />
          <p className="text-xs text-[var(--text-muted)]">
            <b className="text-[var(--text)]">Streak:</b> a cada 7 dias seguidos abrindo o app você ganha um baú raro, sozinho.
          </p>
        </div>
      </section>

      {data && <PotionCard potions={data.potions} rescued={data.rescued} today={data.today} />}

      {recent.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">Últimos baús</h2>
          {recent.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl bg-[var(--surface)] px-3 py-2 text-sm">
              <Target size={16} className="shrink-0 text-[var(--text-muted)]" />
              <span className="min-w-0 flex-1 truncate">{chestLabel(c.source)}</span>
              <ChestContentsView chest={c} />
            </div>
          ))}
        </section>
      )}

      <AnimatePresence>{opened && <OpenChestModal chest={opened} onClose={() => setOpened(null)} />}</AnimatePresence>
    </div>
  )
}
