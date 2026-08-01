import { useState, type KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'

const SUGGESTIONS = [
  'Sissy',
  'Trans',
  'Femboy',
  'Feminização',
  'Humilhação',
  'CEI',
  'Bondage',
  'Roleplay',
  'Exibicionismo',
  'Voyeurismo',
  'Choking',
  'Spanking',
  'Dedicação oral',
  'Praise',
]

export default function KinkChips({ kinks, onChange }: { kinks: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState('')

  function add(value: string) {
    const v = value.trim()
    if (!v || kinks.includes(v)) return
    onChange([...kinks, v])
    setDraft('')
  }

  function remove(kink: string) {
    onChange(kinks.filter((k) => k !== kink))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    add(draft)
  }

  const remainingSuggestions = SUGGESTIONS.filter((s) => !kinks.includes(s))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {kinks.map((kink) => (
          <span
            key={kink}
            className="flex items-center gap-1 rounded-full border border-[var(--accent)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text)]"
          >
            {kink}
            <button onClick={() => remove(kink)} className="text-[var(--text-muted)]">
              <X size={12} />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Adicionar…"
            className="w-28 rounded-full border border-dashed border-[var(--border)] bg-transparent px-3 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
          <button
            onClick={() => add(draft)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {remainingSuggestions.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs text-[var(--text-muted)]">Sugestões</p>
          <div className="flex flex-wrap gap-2">
            {remainingSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => add(s)}
                className="rounded-full border border-dashed border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-muted)]"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
