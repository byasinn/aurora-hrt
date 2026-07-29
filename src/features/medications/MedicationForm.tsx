import { useState, type FormEvent } from 'react'
import { Button, Card } from '../../components/ui'
import { useCreateMedication } from '../../api/medications'
import type { FrequencyType, MedicationInput, MedicationRoute } from '../../../shared/types'
import { weekdayLabel } from '../../lib/dateUtils'
import { todayStr } from '../../lib/dateUtils'

const ROUTES: { value: MedicationRoute; label: string }[] = [
  { value: 'oral', label: 'Oral' },
  { value: 'injection', label: 'Injeção' },
  { value: 'patch', label: 'Adesivo' },
  { value: 'gel', label: 'Gel' },
  { value: 'other', label: 'Outro' },
]

export default function MedicationForm({ onDone }: { onDone: () => void }) {
  const createMed = useCreateMedication()
  const [name, setName] = useState('')
  const [doseAmount, setDoseAmount] = useState('')
  const [doseUnit, setDoseUnit] = useState('mg')
  const [route, setRoute] = useState<MedicationRoute>('oral')
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily')
  const [intervalDays, setIntervalDays] = useState(2)
  const [days, setDays] = useState<number[]>([1, 3, 5])
  const [preferredTime, setPreferredTime] = useState('08:00')
  const [notes, setNotes] = useState('')

  function toggleDay(d: number) {
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name || !doseAmount) return

    const frequencyValue: MedicationInput['frequencyValue'] =
      frequencyType === 'every_n_days'
        ? { intervalDays, anchorDate: todayStr() }
        : frequencyType === 'specific_days'
          ? { days }
          : {}

    await createMed.mutateAsync({
      name,
      doseAmount,
      doseUnit,
      route,
      frequencyType,
      frequencyValue,
      preferredTime,
      notes: notes || null,
      active: true,
    })
    onDone()
  }

  return (
    <Card className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Nome do medicamento</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Estradiol"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-[var(--text-muted)]">Dose</label>
            <input
              value={doseAmount}
              onChange={(e) => setDoseAmount(e.target.value)}
              placeholder="Ex: 2"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-[var(--text-muted)]">Unidade</label>
            <input
              value={doseUnit}
              onChange={(e) => setDoseUnit(e.target.value)}
              placeholder="mg, ml..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Via</label>
          <select
            value={route}
            onChange={(e) => setRoute(e.target.value as MedicationRoute)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          >
            {ROUTES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Frequência</label>
          <select
            value={frequencyType}
            onChange={(e) => setFrequencyType(e.target.value as FrequencyType)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          >
            <option value="daily">Todos os dias</option>
            <option value="every_n_days">A cada N dias</option>
            <option value="specific_days">Dias específicos da semana</option>
          </select>
        </div>

        {frequencyType === 'every_n_days' && (
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">A cada quantos dias</label>
            <input
              type="number"
              min={1}
              value={intervalDays}
              onChange={(e) => setIntervalDays(Number(e.target.value))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          </div>
        )}

        {frequencyType === 'specific_days' && (
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">Dias da semana</label>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={
                    'rounded-lg border px-2.5 py-1.5 text-xs ' +
                    (days.includes(d)
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[#0b0f14]'
                      : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]')
                  }
                >
                  {weekdayLabel(d)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Horário preferido</label>
          <input
            type="time"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={createMed.isPending}>
            {createMed.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
