import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { Pencil, ChevronDown, BatteryLow, Zap, Snowflake, Flame } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button, Card, ScreenTitle } from '../../components/ui'
import { useTags, useCreateTag } from '../../api/tags'
import { useCreateMoodEntry, useUpdateMoodEntry, useMoodEntries } from '../../api/moods'
import { useProfile } from '../../api/profile'
import { todayStr } from '../../lib/dateUtils'
import { toastError } from '../../lib/toast'
import { treat } from '../../lib/genderedText'
import type { Tag, MoodEntry } from '../../../shared/types'

const MOOD_SUGGESTION_FORMS: { icon: string; feminine: string; masculine: string; neutral: string }[] = [
  { icon: '😊', feminine: 'Feliz', masculine: 'Feliz', neutral: 'Feliz' },
  { icon: '😢', feminine: 'Triste', masculine: 'Triste', neutral: 'Triste' },
  { icon: '😡', feminine: 'Irritada', masculine: 'Irritado', neutral: 'Irritade' },
  { icon: '😌', feminine: 'Tranquila', masculine: 'Tranquilo', neutral: 'Tranquile' },
  { icon: '😰', feminine: 'Ansiosa', masculine: 'Ansioso', neutral: 'Ansiose' },
  { icon: '🥱', feminine: 'Cansada', masculine: 'Cansado', neutral: 'Cansade' },
  { icon: '💪', feminine: 'Motivada', masculine: 'Motivado', neutral: 'Motivade' },
  { icon: '🥰', feminine: 'Afetuosa', masculine: 'Afetuoso', neutral: 'Afetuose' },
  { icon: '😍', feminine: 'Confiante', masculine: 'Confiante', neutral: 'Confiante' },
  { icon: '🥹', feminine: 'Sensível', masculine: 'Sensível', neutral: 'Sensível' },
  { icon: '🙏', feminine: 'Grata', masculine: 'Grato', neutral: 'Grate' },
  { icon: '😔', feminine: 'Sozinha', masculine: 'Sozinho', neutral: 'Sozinhe' },
  { icon: '✨', feminine: 'Esperançosa', masculine: 'Esperançoso', neutral: 'Esperançose' },
  { icon: '😩', feminine: 'Sobrecarregada', masculine: 'Sobrecarregado', neutral: 'Sobrecarregade' },
  { icon: '🌈', feminine: 'Orgulhosa', masculine: 'Orgulhoso', neutral: 'Orgulhose' },
  { icon: '😵', feminine: 'Confusa', masculine: 'Confuso', neutral: 'Confuse' },
  { icon: '🥳', feminine: 'Animada', masculine: 'Animado', neutral: 'Animade' },
  { icon: '😞', feminine: 'Desanimada', masculine: 'Desanimado', neutral: 'Desanimade' },
]

function moodSuggestionsFor(style: string | null | undefined): string[] {
  return MOOD_SUGGESTION_FORMS.map((f) => `${f.icon} ${treat(style, f)}`)
}
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

function ScaleSlider({
  label,
  value,
  onChange,
  LowIcon,
  HighIcon,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  LowIcon: LucideIcon
  HighIcon: LucideIcon
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">{label}</h2>
        <span className="text-sm font-semibold text-[var(--text)]">{value}/10</span>
      </div>
      <div className="flex items-center gap-2">
        <LowIcon size={18} className="text-[var(--text-muted)]" />
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 flex-1 accent-[var(--accent)]"
        />
        <HighIcon size={18} className="text-[var(--accent)]" />
      </div>
    </div>
  )
}

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
  // sem isso, clicar de novo numa sugestão pontilhada antes do primeiro clique terminar (a lista só
  // atualiza depois que `tags` recarrega, o que demora um pouco) chamava criar de novo, duplicando a
  // tag — a sugestão continuava visível até o refetch chegar.
  const [pendingLabels, setPendingLabels] = useState<Set<string>>(new Set())

  async function addSuggestion(label: string) {
    if (pendingLabels.has(label)) return
    setPendingLabels((cur) => new Set(cur).add(label))
    try {
      const created = await createTag.mutateAsync({ type, label, emoji: null, color: null, isCustom: false })
      onToggle(created.id)
    } finally {
      setPendingLabels((cur) => {
        const next = new Set(cur)
        next.delete(label)
        return next
      })
    }
  }

  const existingLabels = new Set(tags.map((t) => t.label))
  const remainingSuggestions = suggestions.filter((s) => !existingLabels.has(s) && !pendingLabels.has(s))

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

function TagNames({ ids }: { ids: number[] }) {
  const { data: moodTags = [] } = useTags('mood')
  const { data: symptomTags = [] } = useTags('symptom')
  const all = [...moodTags, ...symptomTags]
  const names = ids.map((id) => all.find((t) => t.id === id)?.label).filter(Boolean)
  if (names.length === 0) return <span className="text-[var(--text-muted)]">—</span>
  return <>{names.join(', ')}</>
}

function EntrySummary({ entry, onEdit, embedded }: { entry: MoodEntry; onEdit: () => void; embedded?: boolean }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        {embedded ? (
          <p className="text-sm font-medium text-[var(--text)]">Humor</p>
        ) : (
          <ScreenTitle>Humor de hoje</ScreenTitle>
        )}
        <Button variant="secondary" onClick={onEdit} className="flex items-center gap-1.5">
          <Pencil size={14} />
          Alterar
        </Button>
      </div>
      <Card className="space-y-3">
        <div>
          <p className="mb-1 text-xs font-medium text-[var(--text-muted)]">Humor</p>
          <p className="text-sm text-[var(--text)]">
            <TagNames ids={(entry.moodTagIds as number[]) ?? []} />
          </p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-[var(--text-muted)]">Sintomas</p>
          <p className="text-sm text-[var(--text)]">
            <TagNames ids={(entry.symptomTagIds as number[]) ?? []} />
          </p>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--text-muted)]">Energia</p>
            <p className="text-lg text-[var(--text)]">{entry.energyLevel ?? '—'}/10</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--text-muted)]">Libido</p>
            <p className="text-lg text-[var(--text)]">{entry.libidoLevel ?? '—'}/10</p>
          </div>
        </div>
        {entry.notes && (
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--text-muted)]">Notas</p>
            <p className="text-sm text-[var(--text)]">{entry.notes}</p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default function MoodCheckIn({ date, embedded }: { date?: string; embedded?: boolean } = {}) {
  const today = date ?? todayStr()
  const { data: entries } = useMoodEntries({ from: today, to: today })
  const { data: profile } = useProfile()
  const createEntry = useCreateMoodEntry()
  const updateEntry = useUpdateMoodEntry()
  const moodSuggestions = moodSuggestionsFor(profile?.textStyle)

  const existing = entries?.[0]
  const [editing, setEditing] = useState(false)
  const [symptomsOpen, setSymptomsOpen] = useState(false)

  const [moodTagIds, setMoodTagIds] = useState<number[]>([])
  const [symptomTagIds, setSymptomTagIds] = useState<number[]>([])
  const [energyLevel, setEnergyLevel] = useState(5)
  const [libidoLevel, setLibidoLevel] = useState(5)
  const [notes, setNotes] = useState('')
  // guarda contra clique duplo de forma síncrona — `createEntry.isPending` só reflete depois de um
  // re-render, então dois cliques bem rápidos (mais rápidos que o React re-renderizar com o botão
  // desabilitado) passavam os dois antes de qualquer um marcar isPending=true.
  const savingRef = useRef(false)

  useEffect(() => {
    if (!existing) return
    setMoodTagIds((existing.moodTagIds as number[]) ?? [])
    setSymptomTagIds((existing.symptomTagIds as number[]) ?? [])
    setEnergyLevel(existing.energyLevel ?? 5)
    setLibidoLevel(existing.libidoLevel ?? 5)
    setNotes(existing.notes ?? '')
    if (((existing.symptomTagIds as number[]) ?? []).length > 0) setSymptomsOpen(true)
  }, [existing])

  function toggle(setFn: React.Dispatch<React.SetStateAction<number[]>>) {
    return (id: number) => setFn((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  async function handleSave() {
    if (savingRef.current) return
    savingRef.current = true
    try {
      if (existing) {
        await updateEntry.mutateAsync({
          id: existing.id,
          moodTagIds,
          symptomTagIds,
          energyLevel,
          libidoLevel,
          notes: notes || null,
        })
      } else {
        await createEntry.mutateAsync({
          date: today,
          moodTagIds,
          symptomTagIds,
          energyLevel,
          libidoLevel,
          notes: notes || null,
        })
      }
      setEditing(false)
    } catch (err) {
      toastError(err, 'Não foi possível salvar o check-in. Tenta de novo.')
    } finally {
      savingRef.current = false
    }
  }

  if (existing && !editing) {
    return <EntrySummary entry={existing} onEdit={() => setEditing(true)} embedded={embedded} />
  }

  return (
    <div className="space-y-5">
      {embedded ? (
        <p className="text-sm font-medium text-[var(--text)]">{existing ? 'Alterar humor' : 'Humor'}</p>
      ) : (
        <ScreenTitle>{existing ? 'Alterar humor de hoje' : 'Como você está hoje?'}</ScreenTitle>
      )}

      <div>
        <h2 className="mb-2 text-sm font-medium text-[var(--text-muted)]">Humor</h2>
        <TagPicker type="mood" suggestions={moodSuggestions} selected={moodTagIds} onToggle={toggle(setMoodTagIds)} />
      </div>

      <button
        type="button"
        onClick={() => setSymptomsOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Como me sinto? (sintomas)</h2>
        <ChevronDown size={16} className={clsx('text-[var(--text-muted)] transition', symptomsOpen && 'rotate-180')} />
      </button>
      {symptomsOpen && (
        <TagPicker
          type="symptom"
          suggestions={SYMPTOM_SUGGESTIONS}
          selected={symptomTagIds}
          onToggle={toggle(setSymptomTagIds)}
        />
      )}

      <ScaleSlider label="Energia" value={energyLevel} onChange={setEnergyLevel} LowIcon={BatteryLow} HighIcon={Zap} />
      <ScaleSlider label="Libido" value={libidoLevel} onChange={setLibidoLevel} LowIcon={Snowflake} HighIcon={Flame} />

      <div>
        <h2 className="mb-2 text-sm font-medium text-[var(--text-muted)]">Notas (opcional)</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div className="flex gap-2">
        {existing && (
          <Button variant="secondary" className="flex-1" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        )}
        <Button className="flex-1" onClick={handleSave} disabled={createEntry.isPending || updateEntry.isPending}>
          {createEntry.isPending || updateEntry.isPending ? 'Salvando…' : 'Salvar check-in'}
        </Button>
      </div>
    </div>
  )
}
