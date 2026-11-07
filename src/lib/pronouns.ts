import type { TextStyle } from '../../shared/types'

/** Opção pronta de pronome + o estilo de texto que ela sugere (só um ponto de partida — a pessoa
 * confirma ou troca o estilo logo depois, e qualquer coisa digitada em "Outro" também vale). */
export interface PronounPreset {
  value: string
  style: TextStyle
}

const PRESETS_BY_LANGUAGE: Record<string, PronounPreset[]> = {
  pt: [
    { value: 'ela/dela', style: 'feminine' },
    { value: 'ele/dele', style: 'masculine' },
    { value: 'elu/delu', style: 'neutral' },
    { value: 'ile/dile', style: 'neutral' },
    { value: 'ela/elu', style: 'feminine' },
    { value: 'ele/elu', style: 'masculine' },
    { value: 'qualquer pronome', style: 'neutral' },
  ],
  en: [
    { value: 'she/her', style: 'feminine' },
    { value: 'he/him', style: 'masculine' },
    { value: 'they/them', style: 'neutral' },
    { value: 'she/they', style: 'feminine' },
    { value: 'he/they', style: 'masculine' },
    { value: 'xe/xem', style: 'neutral' },
    { value: 'any pronouns', style: 'neutral' },
  ],
  es: [
    { value: 'ella', style: 'feminine' },
    { value: 'él', style: 'masculine' },
    { value: 'elle', style: 'neutral' },
    { value: 'ella/elle', style: 'feminine' },
    { value: 'él/elle', style: 'masculine' },
    { value: 'cualquier pronombre', style: 'neutral' },
  ],
  fr: [
    { value: 'elle', style: 'feminine' },
    { value: 'il', style: 'masculine' },
    { value: 'iel', style: 'neutral' },
    { value: 'elle/iel', style: 'feminine' },
    { value: 'il/iel', style: 'masculine' },
    { value: 'tous pronoms', style: 'neutral' },
  ],
}

/** Opções do idioma atual (cai no português se o idioma não tiver lista própria). */
export function pronounPresetsFor(language: string | undefined): PronounPreset[] {
  const base = language?.split('-')[0] ?? 'pt'
  return PRESETS_BY_LANGUAGE[base] ?? PRESETS_BY_LANGUAGE.pt
}

/** Todas as opções prontas, de todos os idiomas — pra saber se um pronome salvo é "Outro" (customizado). */
export const PRONOUN_PRESETS: string[] = Object.values(PRESETS_BY_LANGUAGE).flatMap((list) => list.map((p) => p.value))
