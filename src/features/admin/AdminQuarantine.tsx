import { useState } from 'react'
import clsx from 'clsx'
import { Eye, EyeOff } from 'lucide-react'
import { Check, Trash2 } from '../../components/icons'
import { Button, Card } from '../../components/ui'
import { useQuarantine, useQuarantineAction, type QuarantineItem } from '../../api/adminPanel'
import { toastError } from '../../lib/toast'

const STATUS_TABS = [
  { key: 'pending', label: 'Esperando revisão' },
  { key: 'approved', label: 'Liberadas' },
  { key: 'deleted', label: 'Apagadas' },
  { key: 'all', label: 'Todas' },
]

const STATUS_LABEL: Record<string, string> = { pending: 'pendente', approved: 'liberada', deleted: 'apagada' }

/** As maiores probabilidades que a Sightengine devolveu (ex.: "sexual_display 0.91"), pra entender o porquê. */
function topScores(scores: Record<string, unknown>): string[] {
  const flat: [string, number][] = []
  for (const [k, v] of Object.entries(scores)) {
    if (k === 'none' || k === 'context') continue
    if (typeof v === 'number') flat.push([k, v])
  }
  return flat
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .filter(([, v]) => v >= 0.05)
    .map(([k, v]) => `${k.replace(/_/g, ' ')} ${(v * 100).toFixed(0)}%`)
}

function QuarantineCard({ item }: { item: QuarantineItem }) {
  const [revealed, setRevealed] = useState(false)
  const action = useQuarantineAction()
  const none = typeof item.scores.none === 'number' ? (item.scores.none as number) : null

  function act(kind: 'approve' | 'delete') {
    const msg =
      kind === 'approve'
        ? 'Liberar? A pessoa recebe um aviso e, se enviar a mesma imagem de novo, ela passa.'
        : 'Apagar a imagem de vez? Não dá pra desfazer.'
    if (!confirm(msg)) return
    action.mutate({ id: item.id, action: kind }, { onError: (e) => toastError(e) })
  }

  return (
    <Card className="flex flex-col gap-3 p-3">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--surface-2)]">
        {item.status !== 'deleted' ? (
          <img
            src={`/api/admin/quarantine/${item.id}/image`}
            alt="Imagem barrada"
            loading="lazy"
            className={clsx('h-full w-full object-cover transition', !revealed && 'scale-110 blur-2xl')}
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">arquivo apagado</span>
        )}
        {item.status !== 'deleted' && (
          <button
            onClick={() => setRevealed((v) => !v)}
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white"
          >
            {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
            {revealed ? 'Esconder' : 'Ver'}
          </button>
        )}
      </div>
      <div className="min-w-0 text-sm">
        <p className="truncate font-bold">{item.displayName || item.email || 'conta apagada'}</p>
        <p className="truncate text-xs text-[var(--text-muted)]">
          {item.username ? `@${item.username} · ` : ''}
          {new Date(item.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
        </p>
        <p className="mt-1 text-xs">
          <span className="font-bold">{STATUS_LABEL[item.status]}</span> · {item.reason}
          {none != null && ` · ${((1 - none) * 100).toFixed(0)}% de chance de nudez`}
        </p>
        {topScores(item.scores).length > 0 && <p className="text-[11px] text-[var(--text-muted)]">{topScores(item.scores).join(' · ')}</p>}
      </div>
      {item.status === 'pending' && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => act('approve')} disabled={action.isPending}>
            <Check size={15} className="mr-1 inline" /> Liberar
          </Button>
          <Button variant="secondary" onClick={() => act('delete')} disabled={action.isPending} className="!text-red-500">
            <Trash2 size={15} className="mr-1 inline" /> Apagar
          </Button>
        </div>
      )}
    </Card>
  )
}

export default function AdminQuarantine() {
  const [status, setStatus] = useState('pending')
  const { data, isLoading } = useQuarantine(status)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Imagens barradas</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Fotos que a checagem automática de nudez recusou. A pessoa já recebeu a recusa — aqui você confere se foi engano.
        </p>
      </div>
      <div className="flex gap-1.5 overflow-x-auto">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={clsx(
              'min-h-9 shrink-0 rounded-full border px-3 text-sm',
              status === t.key ? 'border-[var(--accent)] bg-[var(--accent)] font-bold text-[var(--accent-contrast)]' : 'border-[var(--border)] text-[var(--text-muted)]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {data?.length === 0 && <Card className="text-center text-sm text-[var(--text-muted)]">Nada por aqui.</Card>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data?.map((item) => (
          <QuarantineCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
