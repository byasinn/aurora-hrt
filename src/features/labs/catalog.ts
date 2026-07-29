import type { LabType } from '../../../shared/types'

export interface LabDef {
  key: LabType
  label: string
  unit: string
  icon: string
}

export const LAB_CATALOG: LabDef[] = [
  { key: 'estradiol', label: 'Estradiol', unit: 'pg/mL', icon: '🌸' },
  { key: 'testosterone_total', label: 'Testosterona total', unit: 'ng/dL', icon: '💪' },
  { key: 'testosterone_free', label: 'Testosterona livre', unit: 'pg/mL', icon: '💪' },
  { key: 'prolactin', label: 'Prolactina', unit: 'ng/mL', icon: '🩸' },
  { key: 'lh', label: 'LH', unit: 'mIU/mL', icon: '🩸' },
  { key: 'fsh', label: 'FSH', unit: 'mIU/mL', icon: '🩸' },
  { key: 'shbg', label: 'SHBG', unit: 'nmol/L', icon: '🩸' },
  { key: 'potassium', label: 'Potássio', unit: 'mEq/L', icon: '⚠️' },
]
