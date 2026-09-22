import { useEffect, useState } from 'react'
import { Button } from '../../components/ui'
import { useDayNotes, useSaveDayNote } from '../../api/dayNotes'
import { toastError } from '../../lib/toast'

export function noteStatus(note: string | undefined): { filled: boolean; status: string } {
  if (!note) return { filled: false, status: 'Em aberto' }
  return { filled: true, status: note }
}

export default function NoteDayForm({ date }: { date: string }) {
  const { data: notes = [] } = useDayNotes({ from: date, to: date })
  const saveNote = useSaveDayNote()
  const existing = notes.find((n) => n.date === date)
  const [text, setText] = useState(existing?.note ?? '')

  useEffect(() => {
    setText(existing?.note ?? '')
  }, [existing?.note])

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Escreva algo sobre o seu dia…"
        className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
      />
      <Button
        className="w-full"
        disabled={saveNote.isPending || !text.trim() || text === existing?.note}
        onClick={() =>
          saveNote.mutate(
            { date, note: text.trim() },
            { onError: (err) => toastError(err, 'Não foi possível salvar a anotação. Tenta de novo.') },
          )
        }
      >
        Salvar
      </Button>
    </div>
  )
}
