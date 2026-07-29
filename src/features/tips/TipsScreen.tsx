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

export default function TipsScreen() {
  const { data: profile } = useProfile()
  const { data: medications = [] } = useMedications()

  const activeRoutes = [...new Set(medications.filter((m) => m.active).map((m) => m.route))]
  const tips = tipsForContentPreference(profile?.contentPreference, activeRoutes)

  const byCategory = new Map<TipCategory, typeof tips>()
  for (const tip of tips) {
    byCategory.set(tip.category, [...(byCategory.get(tip.category) ?? []), tip])
  }

  return (
    <div className="space-y-4">
      <ScreenTitle>Dicas</ScreenTitle>
      <p className="-mt-3 text-xs text-[var(--text-muted)]">
        Dicas gerais de autocuidado durante a transição hormonal — não substituem acompanhamento médico.
      </p>

      {[...byCategory.entries()].map(([category, categoryTips]) => (
        <div key={category}>
          <h2 className="mb-2 text-sm font-medium text-[var(--text-muted)]">{CATEGORY_LABELS[category]}</h2>
          <div className="space-y-2">
            {categoryTips.map((tip, i) => (
              <Card key={i} className="flex items-start gap-2 py-3">
                <span className="text-lg">{tip.icon}</span>
                <p className="text-sm text-[var(--text)]">{tip.text}</p>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
