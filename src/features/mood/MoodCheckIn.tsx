import { useState } from 'react'
import clsx from 'clsx'
import { Button, Card, ScreenTitle } from '../../components/ui'
import { useTags, useCreateTag } from '../../api/tags'
import { useCreateMoodEntry, useMoodEntries } from '../../api/moods'
import { todayStr } from '../../lib/dateUtils'
import type { Tag } from '../../../shared/types'

const MOOD_SUGGESTIONS = [
  '😊 Feliz',
  '😢 Triste',
  '😡 Irritada',
  '😌 Tranquila',
  '😰 Ansiosa',
  '🥱 Cansada',
  '💪 Motivada',
  '🥰 Afetuosa',
  '😍 Confiante',
  '🥹 Sensível',
  '🙏 Grata',
  '😔 Sozinha',
  '✨ Esperançosa',
  '😩 Sobrecarregada',
  '🌈 Orgulhosa',
  '😵 Confusa',
  '🥳 Animada',
  '😞 Desanimada',
]
const SYMPTOM_SUGGESTIONS = [
  'Sensibilidade nos seios',
  'Ondas de calor',
  'Dor de cabeça',
  'Alteração de libido',
  'Mudança de pele',
  'Inchaço',
  'Insônia',
  'Enjoo',
  'Dor nas articulações',
  'Alteração de apetite',
  'Suor noturno',
  'Queda de cabelo',
  'Crescimento de pelos',
  'Fadiga',
  'Cólica',
  'Retenção de líquido',
  'Dor no local da aplicação',
  'Dor de barriga',
]

function TagPicker({
  type,
  suggestions,
  selected,
  onToggle,
}: {
  type: 'mood' | 'symptom'
  suggestions: string[]
  selected: number[]
  onToggle: (id: number) => void
}) {
  const { data: tags = [] } = useTags(type)
  const createTag = useCreateTag()

  async function addSuggestion(label: string) {
    const created = await createTag.mutateAsync({ type, label, emoji: null, color: null, isCustom: false })
    onToggle(created.id)
  }

  const existingLabels = new Set(tags.map((t) => t.label))
  const remainingSuggestions = suggestions.filter((s) => !existingLabels.has(s))

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag: Tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => onToggle(tag.id)}
          className={clsx(
            'rounded-full border px-3 py-1.5 text-sm transition',
            selected.includes(tag.id)
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
              : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]',
          )}
        >
          {tag.label}
        </button>
      ))}
      {remainingSuggestions.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => addSuggestion(label)}
          className="rounded-full border border-dashed border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-muted)]"
        >
          + {label}
        </button>
      ))}
    </div>
  )
}

export default function MoodCheckIn() {
  const today = todayStr()
  const { data: entries } = useMoodEntries({ from: today, to: today })
  const createEntry = useCreateMoodEntry()

  const [moodTagIds, setMoodTagIds] = useState<number[]>([])
  const [symptomTagIds, setSymptomTagIds] = useState<number[]>([])
  const [energyLevel, setEnergyLevel] = useState(3)
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  const alreadyLoggedToday = (entries?.length ?? 0) > 0 || saved

  function toggle(setFn: React.Dispatch<React.SetStateAction<number[]>>) {
    return (id: number) => setFn((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  async function handleSave() {
    await createEntry.mutateAsync({
      date: today,
      moodTagIds,
      symptomTagIds,
      energyLevel,
      notes: notes || null,
    })
    setSaved(true)
  }

  if (alreadyLoggedToday) {
    return (
      <div>
        <ScreenTitle>Humor</ScreenTitle>
        <Card>
          <p className="text-sm text-[var(--text)]">Você já registrou como está hoje. 💜</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Volte amanhã para um novo check-in.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <ScreenTitle>Como você está hoje?</ScreenTitle>

      <div>
        <h2 className="mb-2 text-sm font-medium text-[var(--text-muted)]">Humor</h2>
        <TagPicker type="mood" suggestions={MOOD_SUGGESTIONS} selected={moodTagIds} onToggle={toggle(setMoodTagIds)} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-[var(--text-muted)]">Sintomas</h2>
        <TagPicker
          type="symptom"
          suggestions={SYMPTOM_SUGGESTIONS}
          selected={symptomTagIds}
          onToggle={toggle(setSymptomTagIds)}
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-[var(--text-muted)]">Energia</h2>
        <div className="flex gap-2">
          {[
            { lvl: 1, emoji: '🪫' },
            { lvl: 2, emoji: '😴' },
            { lvl: 3, emoji: '🙂' },
            { lvl: 4, emoji: '⚡' },
            { lvl: 5, emoji: '🚀' },
          ].map(({ lvl, emoji }) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setEnergyLevel(lvl)}
              className={clsx(
                'h-12 flex-1 rounded-xl border text-lg transition',
                energyLevel === lvl
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]',
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-[var(--text-muted)]">Notas (opcional)</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
      </div>

      <Button className="w-full" onClick={handleSave} disabled={createEntry.isPending}>
        {createEntry.isPending ? 'Salvando…' : 'Salvar check-in'}
      </Button>
    </div>
  )
}
