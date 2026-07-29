import { useMemo, useState } from 'react'
import { Button, Card, ScreenTitle } from '../../components/ui'
import LineChart from '../../components/LineChart'
import { useLabResults, useCreateLabResult, useDeleteLabResult } from '../../api/labs'
import { LAB_CATALOG, type LabDef } from './catalog'
import { formatDateBR, todayStr } from '../../lib/dateUtils'
import type { LabResult } from '../../../shared/types'

function LabCard({ def, entries }: { def: LabDef; entries: LabResult[] }) {
  const createEntry = useCreateLabResult()
  const deleteEntry = useDeleteLabResult()
  const [value, setValue] = useState('')
  const [date, setDate] = useState(todayStr())
  const [showAll, setShowAll] = useState(false)

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const latest = sorted[0]
  const visible = showAll ? sorted : sorted.slice(0, 3)

  async function handleAdd() {
    const num = Number(value)
    if (!value || Number.isNaN(num)) return
    await createEntry.mutateAsync({
      type: def.key,
      label: def.key === 'custom' ? def.label : null,
      value: num,
      unit: def.unit,
      date,
      notes: null,
    })
    setValue('')
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">{def.icon}</span>
        <h3 className="font-medium text-[var(--text)]">{def.label}</h3>
        {latest && (
          <span className="ml-auto text-sm font-semibold flag-gradient-text">
            {latest.value} {def.unit}
          </span>
        )}
      </div>

      {sorted.length > 1 && (
        <LineChart points={sorted.map((e) => ({ date: e.date, value: e.value })).reverse()} unit={def.unit} />
      )}

      <div className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Valor (${def.unit})`}
          className="w-28 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
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
            <button onClick={() => setShowAll((s) => !s)} className="text-xs text-[var(--accent)]">
              {showAll ? 'Ver menos' : `Ver histórico completo (${sorted.length})`}
            </button>
          )}
        </div>
      )}
    </Card>
  )
}

function AddCustomExam({ onAdd }: { onAdd: (label: string, unit: string, value: number, date: string) => void }) {
  const [label, setLabel] = useState('')
  const [unit, setUnit] = useState('')
  const [value, setValue] = useState('')
  const [date, setDate] = useState(todayStr())

  function handleAdd() {
    const num = Number(value)
    if (!label || !unit || !value || Number.isNaN(num)) return
    onAdd(label, unit, num, date)
    setLabel('')
    setUnit('')
    setValue('')
  }

  return (
    <Card className="space-y-2">
      <h3 className="font-medium text-[var(--text)]">+ Outro exame</h3>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Nome do exame"
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
      />
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Valor"
          className="w-24 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Unidade"
          className="w-24 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <input
          type="date"
          value={date}
          max={todayStr()}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <Button onClick={handleAdd}>+</Button>
      </div>
    </Card>
  )
}

export default function LabsScreen() {
  const { data: allResults } = useLabResults()
  const createEntry = useCreateLabResult()

  const resultsByType = useMemo(() => {
    const map = new Map<string, LabResult[]>()
    for (const r of allResults ?? []) {
      const key = r.type === 'custom' ? `custom:${r.label ?? ''}` : r.type
      map.set(key, [...(map.get(key) ?? []), r])
    }
    return map
  }, [allResults])

  const customGroups = [...resultsByType.entries()].filter(([key]) => key.startsWith('custom:'))

  return (
    <div className="space-y-4">
      <ScreenTitle>Exames</ScreenTitle>
      <p className="-mt-3 text-xs text-[var(--text-muted)]">
        Registre resultados de exame de sangue e acompanhe a evolução ao longo da transição.
      </p>

      <div className="space-y-3">
        {LAB_CATALOG.map((def) => (
          <LabCard key={def.key} def={def} entries={resultsByType.get(def.key) ?? []} />
        ))}

        {customGroups.map(([key, entries]) => (
          <LabCard
            key={key}
            def={{ key: 'custom', label: entries[0]?.label ?? 'Exame', unit: entries[0]?.unit ?? '', icon: '🧪' }}
            entries={entries}
          />
        ))}

        <AddCustomExam
          onAdd={(label, unit, value, date) =>
            createEntry.mutate({ type: 'custom', label, value, unit, date, notes: null })
          }
        />
      </div>
    </div>
  )
}
