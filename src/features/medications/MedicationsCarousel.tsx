import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Pill, Syringe, Bandage, Droplet, Sparkles, Trash2, Undo2, PartyPopper } from 'lucide-react'
import { useLogDose, useUpdateDoseLog } from '../../api/doses'
import { useDeleteMedication } from '../../api/medications'
import { formatTime } from '../../lib/dateUtils'
import { formatDaysUntil } from '../../../shared/scheduling'
import { useMedicationSchedule, type MedCard } from './useMedicationSchedule'

const ROUTE_ICONS: Record<string, typeof Pill> = {
  oral: Pill,
  injection: Syringe,
  patch: Bandage,
  gel: Droplet,
  other: Sparkles,
}

function advanceCarousel(el: HTMLElement) {
  const card = el.closest('[data-med-card]')
  const next = card?.nextElementSibling as HTMLElement | null
  next?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
}

function MedCardView({ item, onEdit }: { item: MedCard; onEdit: () => void }) {
  const logDose = useLogDose()
  const updateDose = useUpdateDoseLog()
  const deleteMed = useDeleteMedication()
  const RouteIcon = ROUTE_ICONS[item.medication.route] ?? Sparkles
  const faded = item.state === 'upcoming'

  function markTaken(e: React.MouseEvent) {
    e.stopPropagation()
    if (item.doseLogId) {
      updateDose.mutate({ id: item.doseLogId, status: 'taken', takenAt: new Date() })
    } else if (item.scheduledFor) {
      logDose.mutate({ medicationId: item.medication.id, scheduledFor: new Date(item.scheduledFor), status: 'taken', takenAt: new Date() })
    }
    advanceCarousel(e.currentTarget as HTMLElement)
  }

  function undo(e: React.MouseEvent) {
    e.stopPropagation()
    if (item.doseLogId) {
      updateDose.mutate({ id: item.doseLogId, status: 'pending', takenAt: null })
    } else if (item.scheduledFor) {
      logDose.mutate({ medicationId: item.medication.id, scheduledFor: new Date(item.scheduledFor), status: 'pending' })
    }
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm(`Excluir "${item.medication.name}"? Isso remove o medicamento e seu histórico.`)) {
      deleteMed.mutate(item.medication.id)
    }
  }

  return (
    <button
      type="button"
      data-med-card
      onClick={onEdit}
      className={
        'flex h-full w-full flex-col justify-between gap-3 rounded-2xl border p-4 text-left transition [box-shadow:var(--shadow)] ' +
        (faded
          ? 'border-[var(--border)] bg-[var(--surface)] opacity-50'
          : item.state === 'taken'
            ? 'border-[var(--accent)] bg-[var(--surface)]'
            : item.isMissed
              ? 'border-red-500/50 bg-[var(--surface)]'
              : 'border-[var(--border)] bg-[var(--surface)]')
      }
    >
      <div className="flex items-start gap-3">
        <RouteIcon size={28} className={'shrink-0 ' + (faded ? 'text-[var(--text-muted)]' : 'text-[var(--accent)]')} />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-[var(--text)]">{item.medication.name}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {item.medication.doseAmount}
            {item.medication.doseUnit}
          </p>
          {item.state === 'pending' && item.scheduledFor && (
            <p className={'text-xs ' + (item.isMissed ? 'text-red-500' : 'text-[var(--text-muted)]')}>
              {item.isMissed ? 'atrasado' : formatTime(item.scheduledFor)}
            </p>
          )}
          {faded && item.daysUntil != null && (
            <p className="text-xs text-[var(--text-muted)]">próxima {formatDaysUntil(item.daysUntil)}</p>
          )}
        </div>
        {!faded && item.state === 'pending' && (
          <button onClick={handleDelete} className="shrink-0 text-[var(--text-muted)]">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-end">
        {item.state === 'pending' && (
          <button
            onClick={markTaken}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--accent)] text-[var(--accent)]"
          >
            <Check size={20} />
          </button>
        )}
        {item.state === 'taken' && (
          <button onClick={undo} className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <Undo2 size={14} /> desfazer
          </button>
        )}
      </div>
    </button>
  )
}

export default function MedicationsCarousel({ onEdit }: { onEdit: (medicationId: number) => void }) {
  const { cards, allDoneToday, hasAnyToday, isLoading } = useMedicationSchedule()
  const [celebrate, setCelebrate] = useState(false)
  const prevAllDoneRef = useRef(allDoneToday)

  useEffect(() => {
    const wasAllDone = prevAllDoneRef.current
    prevAllDoneRef.current = allDoneToday
    if (allDoneToday && !wasAllDone && hasAnyToday) {
      setCelebrate(true)
      const t = setTimeout(() => setCelebrate(false), 1600)
      return () => clearTimeout(t)
    }
  }, [allDoneToday, hasAnyToday])

  if (isLoading || cards.length === 0) return null

  // beiradinha (peek) só aparece com 3+ remédios — com 1 ou 2, cada card ocupa a tela toda
  const cardWidth = cards.length <= 2 ? 'w-full' : 'w-[82%]'

  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] snap-x snap-mandatory">
        {cards.map((item) => (
          // um medicamento pode ter mais de uma dose no dia agora — a key precisa diferenciar por
          // horário, não só por medicamento (senão duas doses do mesmo remédio colidem).
          <div
            key={`${item.medication.id}-${item.scheduledFor ?? 'upcoming'}`}
            className={`${cardWidth} min-h-[132px] shrink-0 snap-center`}
          >
            <MedCardView item={item} onEdit={() => onEdit(item.medication.id)} />
          </div>
        ))}
      </div>
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-[var(--bg)]/95 text-sm font-medium text-[var(--accent)]"
          >
            <PartyPopper size={18} />
            Tudo em dia!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
