import { useState, type FormEvent } from 'react'
import { Bell, Plus, X } from 'lucide-react'
import { Button, Card } from '../../components/ui'
import Switch from '../../components/Switch'
import { useCreateMedication, useUpdateMedication } from '../../api/medications'
import type { FrequencyType, Medication, MedicationInput, MedicationRoute } from '../../../shared/types'
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

export default function MedicationForm({
  medication,
  onDone,
}: {
  medication?: Medication
  onDone: () => void
}) {
  const isEdit = !!medication
  const createMed = useCreateMedication()
  const updateMed = useUpdateMedication()
  const saving = createMed.isPending || updateMed.isPending

  const initialFreq = (medication?.frequencyValue ?? {}) as { intervalDays?: number; days?: number[] }

  const [name, setName] = useState(medication?.name ?? '')
  const [doseAmount, setDoseAmount] = useState(medication?.doseAmount ?? '')
  const [doseUnit, setDoseUnit] = useState(medication?.doseUnit ?? 'mg')
  const [route, setRoute] = useState<MedicationRoute>((medication?.route as MedicationRoute) ?? 'oral')
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(
    (medication?.frequencyType as FrequencyType) ?? 'daily',
  )
  const [intervalDays, setIntervalDays] = useState(initialFreq.intervalDays ?? 2)
  const [days, setDays] = useState<number[]>(initialFreq.days ?? [1, 3, 5])
  const [preferredTimes, setPreferredTimes] = useState<string[]>(
    (medication?.preferredTimes as string[] | undefined)?.length ? (medication!.preferredTimes as string[]) : ['08:00'],
  )
  const [notes, setNotes] = useState(medication?.notes ?? '')
  const [hasHistory, setHasHistory] = useState(false)
  const [sinceDate, setSinceDate] = useState(todayStr())
  const [remindersEnabled, setRemindersEnabled] = useState(medication?.remindersEnabled ?? true)

  const MAX_TIMES_PER_DAY = 6

  function toggleDay(d: number) {
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()))
  }

  function updateTimeAt(index: number, value: string) {
    setPreferredTimes((cur) => cur.map((t, i) => (i === index ? value : t)))
  }

  function addTime() {
    setPreferredTimes((cur) => (cur.length >= MAX_TIMES_PER_DAY ? cur : [...cur, '08:00']))
  }

  function removeTime(index: number) {
    setPreferredTimes((cur) => (cur.length <= 1 ? cur : cur.filter((_, i) => i !== index)))
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
    // ordena e remove duplicata — pode acontecer de deixar dois horários iguais sem querer
    const cleanTimes = [...new Set(preferredTimes)].sort()

    if (isEdit) {
      await updateMed.mutateAsync({
        id: medication.id,
        name,
        doseAmount,
        doseUnit,
        route,
        frequencyType,
        frequencyValue,
        preferredTimes: cleanTimes,
        notes: notes || null,
        remindersEnabled,
      })
    } else {
      await createMed.mutateAsync({
        name,
        doseAmount,
        doseUnit,
        route,
        frequencyType,
        frequencyValue,
        preferredTimes: cleanTimes,
        notes: notes || null,
        active: true,
        remindersEnabled,
        ...(hasHistory ? { backfillFrom: sinceDate } : {}),
      })
    }
    onDone()
  }

  return (
    <Card className="space-y-4">
      <h2 className="text-base font-semibold text-[var(--text)]">
        {isEdit ? 'Editar medicamento' : 'Novo medicamento'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Nome do medicamento</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do medicamento"
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
          <label className={labelClass}>
            Horário{preferredTimes.length > 1 ? 's' : ''} preferido{preferredTimes.length > 1 ? 's' : ''}
          </label>
          <div className="space-y-2">
            {preferredTimes.map((time, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => updateTimeAt(i, e.target.value)}
                  className={inputClass}
                />
                {preferredTimes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTime(i)}
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] transition hover:border-red-400 hover:text-red-400"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {preferredTimes.length < MAX_TIMES_PER_DAY && (
            <button
              type="button"
              onClick={addTime}
              className="mt-2 flex cursor-pointer items-center gap-1.5 text-sm text-[var(--accent)]"
            >
              <Plus size={15} /> Adicionar outro horário
            </button>
          )}
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Toma mais de uma vez por dia? Adicione um horário pra cada dose.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
          <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-[var(--text)]">
            <Bell size={16} className="shrink-0 text-[var(--text-muted)]" />
            Lembretes por notificação
          </span>
          <Switch checked={remindersEnabled} onChange={setRemindersEnabled} />
        </div>

        {!isEdit && (
          <>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
              <span className="min-w-0 flex-1 text-sm text-[var(--text)]">Já uso esse medicamento há um tempo</span>
              <Switch checked={hasHistory} onChange={setHasHistory} />
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
          </>
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
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
