import type { MeasurementType } from '../../../shared/types'

export interface MeasurementDef {
  key: MeasurementType
  label: string
  unit: string
  icon: string
  tutorial: string
  category: 'common' | 'feminine' | 'masculine'
}

export const MEASUREMENT_CATALOG: MeasurementDef[] = [
  {
    key: 'weight',
    label: 'Peso',
    unit: 'kg',
    icon: '⚖️',
    tutorial:
      'Pese-se sempre no mesmo horário (de preferência pela manhã, em jejum) e com roupas leves, para manter a comparação justa entre as medições.',
    category: 'common',
  },
  {
    key: 'height',
    label: 'Altura',
    unit: 'cm',
    icon: '📏',
    tutorial:
      'Meça descalça/o, encostada numa parede, com a cabeça reta e o olhar para frente. Muda pouco — vale registrar de vez em quando.',
    category: 'common',
  },
  {
    key: 'body_fat',
    label: '% Gordura corporal',
    unit: '%',
    icon: '📊',
    tutorial:
      'Use uma balança de bioimpedância ou adipômetro. Não é uma medida exata, mas ajuda a ver a tendência ao longo do tempo.',
    category: 'common',
  },
  {
    key: 'bust',
    label: 'Busto',
    unit: 'cm',
    icon: '👙',
    tutorial:
      'Passe a fita métrica ao redor da parte mais larga do busto, na horizontal e sem apertar. Meça sem sutiã ou com um sem bojo.',
    category: 'feminine',
  },
  {
    key: 'hips',
    label: 'Quadril',
    unit: 'cm',
    icon: '📐',
    tutorial: 'Meça ao redor da parte mais larga do quadril e glúteos, com os pés juntos.',
    category: 'feminine',
  },
  {
    key: 'thigh',
    label: 'Coxa',
    unit: 'cm',
    icon: '🦵',
    tutorial: 'Meça ao redor da parte mais grossa da coxa, logo abaixo do quadril.',
    category: 'feminine',
  },
  {
    key: 'waist',
    label: 'Cintura',
    unit: 'cm',
    icon: '📐',
    tutorial: 'Meça ao redor da parte mais estreita da cintura, geralmente logo acima do umbigo, sem prender a barriga.',
    category: 'common',
  },
  {
    key: 'chest',
    label: 'Peito / Tórax',
    unit: 'cm',
    icon: '🫀',
    tutorial:
      'Passe a fita ao redor do tórax, logo abaixo dos mamilos, respirando normalmente (sem prender a respiração).',
    category: 'masculine',
  },
  {
    key: 'shoulders',
    label: 'Ombros',
    unit: 'cm',
    icon: '📐',
    tutorial: 'Meça de uma ponta a outra do ombro (deltoides), com os braços relaxados ao lado do corpo.',
    category: 'masculine',
  },
  {
    key: 'biceps',
    label: 'Bíceps',
    unit: 'cm',
    icon: '💪',
    tutorial: 'Flexione o braço e meça ao redor da parte mais larga do bíceps contraído.',
    category: 'masculine',
  },
]

export function catalogForPreference(pref: string | undefined): MeasurementDef[] {
  if (pref === 'masculine') {
    return MEASUREMENT_CATALOG.filter((m) => m.category === 'common' || m.category === 'masculine')
  }
  if (pref === 'combined') return MEASUREMENT_CATALOG
  // 'feminine' e padrão
  return MEASUREMENT_CATALOG.filter((m) => m.category === 'common' || m.category === 'feminine')
}
