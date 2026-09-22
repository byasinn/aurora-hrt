import { useState } from 'react'
import { Flag, X } from 'lucide-react'
import { Button, Card } from './ui'
import { useCreateReport } from '../api/reports'
import { toastError, showToast } from '../lib/toast'
import type { ReportTargetType } from '../../shared/types'

export default function ReportButton({
  targetType,
  targetId,
  label,
  iconSize = 14,
  className,
  onTriggerClick,
}: {
  targetType: ReportTargetType
  targetId: number
  label?: string
  iconSize?: number
  className?: string
  /** roda antes de abrir o modal — útil pra fechar um menu que já estava aberto */
  onTriggerClick?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const createReport = useCreateReport()

  async function submit() {
    try {
      await createReport.mutateAsync({ targetType, targetId, reason: reason.trim() || null })
      showToast('Denúncia enviada — obrigada por ajudar a manter o espaço seguro.', 'info')
      setOpen(false)
      setReason('')
    } catch (err) {
      toastError(err, 'Não foi possível enviar a denúncia.')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onTriggerClick?.()
          setOpen(true)
        }}
        className={className ?? 'flex items-center gap-1.5 text-sm text-red-500'}
      >
        <Flag size={iconSize} /> {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <Card className="w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--text)]">
                <Flag size={14} className="text-red-500" /> Denunciar
              </p>
              <button onClick={() => setOpen(false)}>
                <X size={16} className="text-[var(--text-muted)]" />
              </button>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Conte o que aconteceu (opcional)"
              rows={3}
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
            <Button className="w-full" onClick={submit} disabled={createReport.isPending}>
              Enviar denúncia
            </Button>
          </Card>
        </div>
      )}
    </>
  )
}
