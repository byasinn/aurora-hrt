export type TipCategory = 'injection' | 'oral' | 'patch_gel' | 'feminine' | 'masculine' | 'mental_health' | 'general'

export interface Tip {
  category: TipCategory
  icon: string
  text: string
}

export const TIPS: Tip[] = [
  {
    category: 'general',
    icon: '🧪',
    text: 'Dicas personalizadas em breve.',
  },
]

export function tipsForContentPreference(pref: string | undefined, activeRoutes: string[] = []): Tip[] {
  const categories = new Set<TipCategory>(['general', 'mental_health'])
  if (activeRoutes.includes('injection')) categories.add('injection')
  if (activeRoutes.includes('oral')) categories.add('oral')
  if (activeRoutes.includes('patch') || activeRoutes.includes('gel')) categories.add('patch_gel')

  if (pref === 'masculine') categories.add('masculine')
  else if (pref === 'combined') {
    categories.add('feminine')
    categories.add('masculine')
  } else categories.add('feminine')

  return TIPS.filter((t) => categories.has(t.category))
}
