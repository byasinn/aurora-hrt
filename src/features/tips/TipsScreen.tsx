import { useState } from 'react'
import { Card, ScreenTitle } from '../../components/ui'
import { useProfile } from '../../api/profile'
import { useMedications } from '../../api/medications'
import { tipsForContentPreference, type TipCategory } from '../../lib/tips'

const CATEGORY_LABELS: Record<TipCategory, string> = {
  injection: 'Injeção',
  oral: 'Via oral',
  patch_gel: 'Adesivo e gel',
  feminine: 'Transição feminizante',
  masculine: 'Transição masculinizante',
  mental_health: 'Saúde mental',
  general: 'Geral',
}

const CATEGORY_ICONS: Record<TipCategory, string> = {
  injection: '💉',
  oral: '💊',
  patch_gel: '🩹',
  feminine: '🌸',
  masculine: '💪',
  mental_health: '💜',
  general: '🧪',
}

export default function TipsScreen() {
  const { data: profile } = useProfile()
  const { data: medications = [] } = useMedications()

  const activeRoutes = [...new Set(medications.filter((m) => m.active).map((m) => m.route))]
  const tips = tipsForContentPreference(profile?.contentPreference, activeRoutes)

  const byCategory = new Map<TipCategory, typeof tips>()
  for (const tip of tips) {
    byCategory.set(tip.category, [...(byCategory.get(tip.category) ?? []), tip])
  }
  const categories = [...byCategory.keys()]

  const [selected, setSelected] = useState<TipCategory | null>(null)
  const activeCategory = selected && byCategory.has(selected) ? selected : (categories[0] ?? null)

  return (
    <div className="space-y-4">
      <ScreenTitle>Dicas</ScreenTitle>
      <p className="-mt-3 text-xs text-[var(--text-muted)]">
        Dicas gerais de autocuidado durante a transição hormonal — não substituem acompanhamento médico.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {categories.map((category) => {
          const isActive = category === activeCategory
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelected(category)}
              className={
                'flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition ' +
                (isActive
                  ? 'border-[var(--accent)] bg-[var(--surface-2)]'
                  : 'border-[var(--border)] bg-[var(--surface)]')
              }
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/15 text-lg">
                {CATEGORY_ICONS[category]}
              </span>
              <span className="text-[11px] font-medium leading-tight text-[var(--text)]">{CATEGORY_LABELS[category]}</span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {byCategory.get(category)?.length} dica{byCategory.get(category)?.length === 1 ? '' : 's'}
              </span>
            </button>
          )
        })}
      </div>

      {activeCategory && (
        <div className="space-y-2">
          {byCategory.get(activeCategory)?.map((tip, i) => (
            <Card key={i} className="flex items-start gap-2 py-3">
              <span className="text-lg">{tip.icon}</span>
              <p className="text-sm text-[var(--text)]">{tip.text}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
