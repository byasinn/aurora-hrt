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

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]'
const labelClass = 'mb-1.5 block text-xs font-medium text-[var(--text-muted)]'

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
  const [hasHistory, setHasHistory] = useState(false)
  const [sinceDate, setSinceDate] = useState(todayStr())

  function toggleDay(d: number) {
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name || !doseAmount) return

    const anchorDate = hasHistory ? sinceDate : todayStr()
    const frequencyValue: MedicationInput['frequencyValue'] =
      frequencyType === 'every_n_days'
        ? { intervalDays, anchorDate }
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
      ...(hasHistory ? { backfillFrom: sinceDate } : {}),
    })
    onDone()
  }

  return (
    <Card className="space-y-4">
      <h2 className="text-base font-semibold text-[var(--text)]">Novo medicamento</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Nome do medicamento</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Estradiol, Perlutan…"
            className={inputClass}
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className={labelClass}>Dose</label>
            <input
              value={doseAmount}
              onChange={(e) => setDoseAmount(e.target.value)}
              placeholder="Ex: 2"
              className={inputClass}
            />
          </div>
          <div className="flex-1">
            <label className={labelClass}>Unidade</label>
            <input
              value={doseUnit}
              onChange={(e) => setDoseUnit(e.target.value)}
              placeholder="mg, ml..."
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Via</label>
          <div className="flex flex-wrap gap-2">
            {ROUTES.map((r) => (
              <button
                type="button"
                key={r.value}
                onClick={() => setRoute(r.value)}
                className={
                  'rounded-full border px-3 py-1.5 text-sm transition ' +
                  (route === r.value
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                    : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]')
                }
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Frequência</label>
          <select
            value={frequencyType}
            onChange={(e) => setFrequencyType(e.target.value as FrequencyType)}
            className={inputClass}
          >
            <option value="daily">Todos os dias</option>
            <option value="every_n_days">A cada N dias</option>
            <option value="specific_days">Dias específicos da semana</option>
          </select>
        </div>

        {frequencyType === 'every_n_days' && (
          <div>
            <label className={labelClass}>A cada quantos dias</label>
            <input
              type="number"
              min={1}
              value={intervalDays}
              onChange={(e) => setIntervalDays(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        )}

        {frequencyType === 'specific_days' && (
          <div>
            <label className={labelClass}>Dias da semana</label>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={
                    'rounded-lg border px-2.5 py-1.5 text-xs transition ' +
                    (days.includes(d)
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
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
          <label className={labelClass}>Horário preferido</label>
          <input
            type="time"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            className={inputClass}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
          <input
            type="checkbox"
            checked={hasHistory}
            onChange={(e) => setHasHistory(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          <span className="text-sm text-[var(--text)]">Já uso esse medicamento há um tempo</span>
        </label>

        {hasHistory && (
          <div>
            <label className={labelClass}>Uso desde</label>
            <input
              type="date"
              value={sinceDate}
              max={todayStr()}
              onChange={(e) => setSinceDate(e.target.value)}
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              Vamos preencher o histórico automaticamente com base na frequência escolhida.
            </p>
          </div>
        )}

        <div>
          <label className={labelClass}>Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={inputClass}
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
