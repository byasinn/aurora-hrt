import { useState } from 'react'
import { Button, Card, ScreenTitle } from '../../components/ui'
import { useProfile } from '../../api/profile'
import { useMeasurements, useCreateMeasurement, useDeleteMeasurement } from '../../api/measurements'
import { catalogForPreference, type MeasurementDef } from './catalog'
import { formatDateBR, todayStr } from '../../lib/dateUtils'

function MeasurementCard({ def }: { def: MeasurementDef }) {
  const { data: entries } = useMeasurements(def.key)
  const createEntry = useCreateMeasurement()
  const deleteEntry = useDeleteMeasurement()
  const [value, setValue] = useState('')
  const [date, setDate] = useState(todayStr())
  const [showAll, setShowAll] = useState(false)

  const sorted = [...(entries ?? [])].sort((a, b) => b.date.localeCompare(a.date))
  const latest = sorted[0]
  const previous = sorted[1]
  const delta = latest && previous ? latest.value - previous.value : null

  async function handleAdd() {
    const num = Number(value)
    if (!value || Number.isNaN(num)) return
    await createEntry.mutateAsync({ type: def.key, value: num, unit: def.unit, date, notes: null })
    setValue('')
  }

  const visible = showAll ? sorted : sorted.slice(0, 3)

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-lg">
          {def.icon}
        </span>
        <h3 className="font-medium text-[var(--text)]">{def.label}</h3>
        {latest && (
          <span className="ml-auto text-sm font-semibold flag-gradient-text">
            {latest.value} {def.unit}
          </span>
        )}
      </div>

      {delta !== null && (
        <p className="text-xs text-[var(--text-muted)]">
          {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {Math.abs(delta).toFixed(1)} {def.unit} desde a última
          medição
        </p>
      )}

      <details className="text-xs text-[var(--text-muted)]">
        <summary className="cursor-pointer select-none text-[var(--accent)]">Como medir?</summary>
        <p className="mt-1">{def.tutorial}</p>
      </details>

      <div className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Valor (${def.unit})`}
          className="w-24 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <input
          type="date"
          value={date}
          max={todayStr()}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <Button onClick={handleAdd} disabled={createEntry.isPending}>
          +
        </Button>
      </div>

      {sorted.length > 0 && (
        <div className="space-y-1 border-t border-[var(--border)] pt-2">
          {visible.map((e) => (
            <div key={e.id} className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>{formatDateBR(e.date)}</span>
              <span>
                {e.value} {e.unit}
              </span>
              <button onClick={() => deleteEntry.mutate(e.id)} className="text-red-400">
                excluir
              </button>
            </div>
          ))}
          {sorted.length > 3 && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="text-xs text-[var(--accent)]"
            >
              {showAll ? 'Ver menos' : `Ver histórico completo (${sorted.length})`}
            </button>
          )}
        </div>
      )}
    </Card>
  )
}

export default function MeasurementsScreen() {
  const { data: profile } = useProfile()
  const fullCatalog = catalogForPreference(profile?.contentPreference)

  return (
    <div className="space-y-4">
      <ScreenTitle>Medidas</ScreenTitle>
      <p className="-mt-3 text-xs text-[var(--text-muted)]">
        Acompanhe suas medidas ao longo da transição. Pode ajustar quais medidas aparecem aqui em Perfil →
        Conteúdo de medidas.
      </p>
      <div className="space-y-3">
        {fullCatalog.map((def) => (
          <MeasurementCard key={def.key} def={def} />
        ))}
      </div>
    </div>
  )
}
