import { useState } from 'react'
import clsx from 'clsx'
import { Plus, Trash2 } from '../../components/icons'
import { Button, Card } from '../../components/ui'
import Switch from '../../components/Switch'
import { useAdminPromotions, useDeletePromotion, useSavePromotion, type PromotionInput } from '../../api/shop'
import { SHOP_ITEMS, SHOP_ITEM_BY_KEY, SHOP_KINDS, SHOP_KIND_LABEL, SHOP_TAGS } from '../../../shared/shopCatalog'
import { DEFAULT_RANDOM_PROMO, POTION_OFFERS, POTION_OFFER_BY_KEY, type PromoScope, type Promotion } from '../../../shared/shopPromos'
import { toastError } from '../../lib/toast'

// Promoções da lojinha: as do admin (toda a loja, um departamento, uma categoria, um item ou as
// poções, com começo e fim) e a configuração das ofertas aleatórias do dia.

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]'

const SCOPE_LABEL: Record<Exclude<PromoScope, 'random'>, string> = {
  all: 'Toda a lojinha',
  kind: 'Um departamento',
  tag: 'Uma categoria',
  item: 'Um item',
  potions: 'As poções',
}

/** Date ISO -> valor de <input type="datetime-local"> no horário local. */
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function targetLabel(p: Promotion): string {
  if (p.scope === 'all') return 'toda a lojinha'
  if (p.scope === 'potions') return 'poções'
  if (p.scope === 'kind') return SHOP_KIND_LABEL[p.target as keyof typeof SHOP_KIND_LABEL] ?? p.target ?? ''
  if (p.scope === 'tag') return SHOP_TAGS.find((t) => t.key === p.target)?.label ?? p.target ?? ''
  if (p.scope === 'item') return SHOP_ITEM_BY_KEY.get(p.target ?? '')?.name ?? POTION_OFFER_BY_KEY.get(p.target ?? '')?.name ?? p.target ?? ''
  return ''
}

function PromoForm({ onDone }: { onDone: () => void }) {
  const save = useSavePromotion()
  const [p, setP] = useState<PromotionInput>({
    title: 'Promoção',
    percent: 20,
    scope: 'all',
    target: null,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    active: true,
  })
  const set = <K extends keyof PromotionInput>(k: K, v: PromotionInput[K]) => setP((cur) => ({ ...cur, [k]: v }))

  return (
    <Card className="space-y-3">
      <p className="font-bold">Nova promoção</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs font-medium text-[var(--text-muted)]">
          Nome (aparece no selinho)
          <input className={inputClass} value={p.title} maxLength={60} onChange={(e) => set('title', e.target.value)} />
        </label>
        <label className="space-y-1 text-xs font-medium text-[var(--text-muted)]">
          Desconto (%)
          <input type="number" min={1} max={90} className={inputClass} value={p.percent} onChange={(e) => set('percent', Math.max(1, Math.min(90, Number(e.target.value) || 1)))} />
        </label>
        <label className="space-y-1 text-xs font-medium text-[var(--text-muted)]">
          Onde vale
          <select
            className={inputClass}
            value={p.scope}
            onChange={(e) => {
              const scope = e.target.value as PromoScope
              setP((cur) => ({ ...cur, scope, target: scope === 'kind' ? SHOP_KINDS[0] : scope === 'tag' ? SHOP_TAGS[0].key : scope === 'item' ? SHOP_ITEMS.find((i) => i.price > 0)!.key : null }))
            }}
          >
            {Object.entries(SCOPE_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {p.scope === 'kind' && (
          <label className="space-y-1 text-xs font-medium text-[var(--text-muted)]">
            Departamento
            <select className={inputClass} value={p.target ?? ''} onChange={(e) => set('target', e.target.value)}>
              {SHOP_KINDS.map((k) => (
                <option key={k} value={k}>
                  {SHOP_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
        )}
        {p.scope === 'tag' && (
          <label className="space-y-1 text-xs font-medium text-[var(--text-muted)]">
            Categoria
            <select className={inputClass} value={p.target ?? ''} onChange={(e) => set('target', e.target.value)}>
              {SHOP_TAGS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {p.scope === 'item' && (
          <label className="space-y-1 text-xs font-medium text-[var(--text-muted)]">
            Item
            <select className={inputClass} value={p.target ?? ''} onChange={(e) => set('target', e.target.value)}>
              {[...SHOP_ITEMS.filter((i) => i.price > 0), ...POTION_OFFERS].map((i) => (
                <option key={i.key} value={i.key}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="space-y-1 text-xs font-medium text-[var(--text-muted)]">
          Começa
          <input type="datetime-local" className={inputClass} value={toLocalInput(p.startsAt)} onChange={(e) => set('startsAt', e.target.value ? new Date(e.target.value).toISOString() : null)} />
        </label>
        <label className="space-y-1 text-xs font-medium text-[var(--text-muted)]">
          Termina
          <input type="datetime-local" className={inputClass} value={toLocalInput(p.endsAt)} onChange={(e) => set('endsAt', e.target.value ? new Date(e.target.value).toISOString() : null)} />
        </label>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onDone}>
          Cancelar
        </Button>
        <Button className="flex-1" disabled={save.isPending} onClick={() => save.mutate(p, { onSuccess: onDone, onError: (e) => toastError(e) })}>
          Criar promoção
        </Button>
      </div>
    </Card>
  )
}

function RandomDealsCard({ row }: { row: Promotion | undefined }) {
  const save = useSavePromotion()
  const active = row ? row.active : true
  const percent = row?.percent ?? DEFAULT_RANDOM_PROMO.percent
  const count = Number(row?.target) || DEFAULT_RANDOM_PROMO.count
  const update = (patch: Partial<{ active: boolean; percent: number; count: number }>) =>
    save.mutate(
      {
        id: row?.id,
        title: 'Oferta do dia',
        scope: 'random',
        percent: patch.percent ?? percent,
        target: String(patch.count ?? count),
        startsAt: null,
        endsAt: null,
        active: patch.active ?? active,
      },
      { onError: (e) => toastError(e) },
    )

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bold">Ofertas aleatórias do dia</p>
          <p className="text-xs text-[var(--text-muted)]">Todo dia, à meia-noite, alguns itens sorteados ganham desconto — igual pra todo mundo.</p>
        </div>
        <Switch checked={active} onChange={(v) => update({ active: v })} />
      </div>
      <div className={clsx('grid grid-cols-2 gap-3', !active && 'opacity-50')}>
        <label className="space-y-1 text-xs font-medium text-[var(--text-muted)]">
          Desconto (%)
          <input type="number" min={1} max={90} className={inputClass} defaultValue={percent} onBlur={(e) => update({ percent: Math.max(1, Math.min(90, Number(e.target.value) || 10)) })} />
        </label>
        <label className="space-y-1 text-xs font-medium text-[var(--text-muted)]">
          Itens por dia
          <input type="number" min={1} max={12} className={inputClass} defaultValue={count} onBlur={(e) => update({ count: Math.max(1, Math.min(12, Number(e.target.value) || 3)) })} />
        </label>
      </div>
    </Card>
  )
}

export default function AdminPromotions() {
  const { data, isLoading } = useAdminPromotions()
  const del = useDeletePromotion()
  const save = useSavePromotion()
  const [creating, setCreating] = useState(false)
  const promos = data?.promotions.filter((p) => p.scope !== 'random') ?? []
  const randomRow = data?.promotions.find((p) => p.scope === 'random')
  const today = Object.entries(data?.today ?? {})

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Promoções</h1>
          <p className="text-sm text-[var(--text-muted)]">Descontos na lojinha. Se duas valem no mesmo item, fica a maior (não acumula).</p>
        </div>
        {!creating && (
          <Button className="shrink-0" onClick={() => setCreating(true)}>
            <Plus size={16} /> Nova
          </Button>
        )}
      </div>
      {creating && <PromoForm onDone={() => setCreating(false)} />}
      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {data && <RandomDealsCard row={randomRow} />}

      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">Suas promoções</h2>
        {promos.length === 0 && <p className="text-sm text-[var(--text-muted)]">Nenhuma ainda.</p>}
        {promos.map((p) => {
          const ended = p.endsAt && new Date(p.endsAt) < new Date()
          return (
            <Card key={p.id} className={clsx('flex items-center gap-3 p-3', (!p.active || ended) && 'opacity-50')}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  {p.title} · -{p.percent}%
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {targetLabel(p)} · {p.startsAt ? new Date(p.startsAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'já'} até{' '}
                  {p.endsAt ? new Date(p.endsAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'sem fim'}
                  {ended && ' · acabou'}
                </p>
              </div>
              <Switch checked={p.active} onChange={(v) => save.mutate({ ...p, active: v }, { onError: (e) => toastError(e) })} />
              <button aria-label="Apagar" onClick={() => confirm(`Apagar "${p.title}"?`) && del.mutate(p.id)} className="p-1 text-red-500">
                <Trash2 size={15} />
              </button>
            </Card>
          )
        })}
      </section>

      {today.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">Com desconto agora</h2>
          <div className="flex flex-wrap gap-1.5">
            {today.map(([key, promo]) => (
              <span key={key} className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs">
                <b>-{promo.percent}%</b> {SHOP_ITEM_BY_KEY.get(key)?.name ?? POTION_OFFER_BY_KEY.get(key)?.name ?? key} · {promo.label}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
