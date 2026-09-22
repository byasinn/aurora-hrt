export interface GenderedForms {
  feminine: string
  masculine: string
  neutral: string
}

/** Escolhe a forma certa do texto pro estilo de linguagem da pessoa (padrão: feminino). */
export function treat(style: string | null | undefined, forms: GenderedForms): string {
  if (style === 'masculine') return forms.masculine
  if (style === 'neutral') return forms.neutral
  return forms.feminine
}
