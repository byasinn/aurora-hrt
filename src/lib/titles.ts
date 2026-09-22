import { treat, type GenderedForms } from './genderedText'

export interface TitleDef {
  key: string
  name: GenderedForms
  threshold: number
  icon: string
}

export const SFW_TITLES: TitleDef[] = [
  { key: 'chegada', name: { feminine: 'Chegada', masculine: 'Chegado', neutral: 'Chegade' }, threshold: 0, icon: 'footprints' },
  { key: 'observadora', name: { feminine: 'Observadora', masculine: 'Observador', neutral: 'Observadore' }, threshold: 50, icon: 'eye' },
  { key: 'participante', name: { feminine: 'Participante', masculine: 'Participante', neutral: 'Participante' }, threshold: 150, icon: 'users' },
  { key: 'voz_ativa', name: { feminine: 'Voz Ativa', masculine: 'Voz Ativa', neutral: 'Voz Ativa' }, threshold: 300, icon: 'message_circle' },
  { key: 'contribuidora', name: { feminine: 'Contribuidora', masculine: 'Contribuidor', neutral: 'Contribuidore' }, threshold: 500, icon: 'handshake' },
  { key: 'guia', name: { feminine: 'Guia', masculine: 'Guia', neutral: 'Guia' }, threshold: 750, icon: 'compass' },
  { key: 'ancora', name: { feminine: 'Âncora', masculine: 'Âncora', neutral: 'Âncora' }, threshold: 1100, icon: 'anchor' },
  { key: 'referencia', name: { feminine: 'Referência', masculine: 'Referência', neutral: 'Referência' }, threshold: 1500, icon: 'landmark' },
  { key: 'matriarca', name: { feminine: 'Matriarca', masculine: 'Patriarca', neutral: 'Ícone' }, threshold: 2000, icon: 'crown' },
  { key: 'lenda_viva', name: { feminine: 'Lenda Viva', masculine: 'Lenda Viva', neutral: 'Lenda Viva' }, threshold: 2750, icon: 'sparkles' },
]

/**
 * Não são por pontos — concedidos automaticamente (criadora só pra admin; beta_tester era concedido a
 * todo mundo que entrava durante a fase de testes, mas isso parou — só quem já tinha continua com o título).
 * Ordem = prioridade de exibição: se a conta tiver as duas (ex: virou admin depois de já ter beta tester), mostra a primeira que bater.
 */
export const SPECIAL_TITLES: TitleDef[] = [
  { key: 'criadora', name: { feminine: 'Criadora', masculine: 'Criador', neutral: 'Criadore' }, threshold: 0, icon: 'crown' },
  { key: 'beta_tester', name: { feminine: 'Beta Tester', masculine: 'Beta Tester', neutral: 'Beta Tester' }, threshold: 0, icon: 'sparkle' },
]

/** Nome do título na forma certa pro estilo de linguagem de quem O TEM (não de quem está vendo). */
export function titleName(def: TitleDef, style: string | null | undefined): string {
  return treat(style, def.name)
}

export function resolveSpecialTitle(unlockedKeys: Set<string> | string[]): TitleDef | null {
  const keys = unlockedKeys instanceof Set ? unlockedKeys : new Set(unlockedKeys)
  return SPECIAL_TITLES.find((t) => keys.has(t.key)) ?? null
}

export function unlockedTitlesForBalance(balance: number): TitleDef[] {
  return SFW_TITLES.filter((t) => balance >= t.threshold)
}

export function currentTitle(balance: number): TitleDef {
  const unlocked = unlockedTitlesForBalance(balance)
  return unlocked[unlocked.length - 1] ?? SFW_TITLES[0]
}

export function nextTitle(balance: number): TitleDef | null {
  return SFW_TITLES.find((t) => balance < t.threshold) ?? null
}
