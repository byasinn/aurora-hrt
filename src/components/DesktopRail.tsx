import { Link, useLocation } from 'react-router-dom'
import { Coins, Flame, Gift, Potion } from './icons'
import { Card } from './ui'
import { usePoints, useMissions } from '../api/points'
import { useShop } from '../api/shop'
import { SHOP_ITEM_BY_KEY, ownsItem } from '../../shared/shopCatalog'
import { POTION_OFFER_BY_KEY } from '../../shared/shopPromos'
import { DEPARTMENT_BY_KIND } from '../features/shop/departments'
import { playSound } from '../lib/sounds'

// Coluna da direita no PC largo (≥1280px): o que no celular fica no botão do Aurora, sempre à vista —
// streak, Brilho, missões prontas e ofertas do dia. Some nas telas que já mostram isso grande.

const HIDE_ON = ['/missoes', '/loja', '/aurora']

export default function DesktopRail() {
  const location = useLocation()
  const { data: points } = usePoints()
  const { data: missions } = useMissions()
  const { data: shop } = useShop()
  if (HIDE_ON.some((p) => location.pathname.startsWith(p))) return null

  const ready =
    (missions?.missions.filter((m) => !m.hidden && !m.claimed && m.progress >= m.target && (m.group !== 'daily' || missions.dailyUnlocked)).length ?? 0) +
    (missions?.chests.length ?? 0)
  const week = points?.week
  const deals = Object.entries(shop?.promos ?? {})
    .filter(([key]) => !SHOP_ITEM_BY_KEY.has(key) || !ownsItem(shop?.owned ?? [], key))
    .slice(0, 3)

  return (
    <aside className="sticky top-0 hidden h-app w-72 shrink-0 flex-col gap-3 overflow-y-auto py-8 pl-2 pr-6 xl:flex">
      <Link to="/missoes" onClick={() => playSound('tap')} className="block">
        <Card className="space-y-3 transition hover:-translate-y-0.5">
          <div className="grid grid-cols-3 text-center">
            <span>
              <Flame size={20} className="mx-auto text-orange-500" />
              <span className="font-pixel block text-xl font-bold text-[var(--text)]">{points?.visitStreak ?? '–'}</span>
              <span className="block text-[11px] text-[var(--text-muted)]">streak</span>
            </span>
            <span>
              <Coins size={20} className="mx-auto text-amber-500" />
              <span className="font-pixel block text-xl font-bold text-[var(--text)]">{shop?.balance ?? '–'}</span>
              <span className="block text-[11px] text-[var(--text-muted)]">Brilho</span>
            </span>
            <span>
              <Potion size={20} className="mx-auto" />
              <span className="font-pixel block text-xl font-bold text-[var(--text)]">{points?.potions ?? '–'}</span>
              <span className="block text-[11px] text-[var(--text-muted)]">poções</span>
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[var(--accent-soft)] px-3 py-2">
            <Gift size={22} />
            <span className="min-w-0 flex-1 text-sm font-bold text-[var(--text)]">{ready > 0 ? `${ready} recompensa${ready > 1 ? 's' : ''} pra pegar` : 'Missões do dia'}</span>
            {ready > 0 && <span className="h-2 w-2 rounded-full bg-red-500" />}
          </div>
        </Card>
      </Link>

      {week && (
        <Card className="space-y-2">
          <p className="text-sm font-bold text-[var(--text)]">Essa semana</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Dias registrados</span>
              <span className="font-bold text-[var(--text)]">{week.dayLogDays}/7</span>
            </div>
            {week.meds.slice(0, 3).map((m) => (
              <div key={m.medicationId} className="flex justify-between gap-2">
                <span className="truncate text-[var(--text-muted)]">{m.name}</span>
                <span className="shrink-0 font-bold text-[var(--text)]">{m.doneDays === m.dueDays ? 'em dia' : `${m.doneDays}/${m.dueDays}`}</span>
              </div>
            ))}
            {week.workoutGoal > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Treinos</span>
                <span className="font-bold text-[var(--text)]">
                  {week.workouts}/{week.workoutGoal}
                </span>
              </div>
            )}
          </div>
          <Link to="/pontos/brilho" className="block text-xs font-bold text-[var(--accent)]">
            Ver meu Brilho →
          </Link>
        </Card>
      )}

      {deals.length > 0 && (
        <Card className="space-y-2">
          <p className="text-sm font-bold text-[var(--text)]">Em promoção</p>
          {deals.map(([key, promo]) => {
            const item = SHOP_ITEM_BY_KEY.get(key)
            const potion = POTION_OFFER_BY_KEY.get(key)
            const dept = item ? DEPARTMENT_BY_KIND.get(item.kind) : DEPARTMENT_BY_KIND.get('potion')
            return (
              <Link key={key} to={`/loja/${dept?.slug ?? ''}`} className="flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-2.5 py-2 text-sm">
                <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">-{promo.percent}%</span>
                <span className="min-w-0 flex-1 truncate font-bold text-[var(--text)]">{item?.name ?? potion?.name}</span>
              </Link>
            )
          })}
        </Card>
      )}
    </aside>
  )
}
