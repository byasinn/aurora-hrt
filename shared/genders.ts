// Identidades de gênero que a pessoa pode escolher no perfil. Guarda a key; "Outro" guarda o texto
// que a pessoa escreveu, com o prefixo "custom:". A lista não tenta ser definitiva — por isso o Outro.

export const GENDER_OPTIONS = [
  { key: 'trans_woman', label: 'Mulher trans' },
  { key: 'trans_man', label: 'Homem trans' },
  { key: 'travesti', label: 'Travesti' },
  { key: 'woman', label: 'Mulher' },
  { key: 'man', label: 'Homem' },
  { key: 'nonbinary', label: 'Não-binárie' },
  { key: 'transfeminine', label: 'Transfeminine' },
  { key: 'transmasculine', label: 'Transmasculine' },
  { key: 'agender', label: 'Agênero' },
  { key: 'genderfluid', label: 'Gênero fluido' },
  { key: 'genderqueer', label: 'Genderqueer' },
  { key: 'bigender', label: 'Bigênero' },
  { key: 'trigender', label: 'Trigênero' },
  { key: 'pangender', label: 'Pangênero' },
  { key: 'polygender', label: 'Poligênero' },
  { key: 'demigirl', label: 'Demigarota' },
  { key: 'demiboy', label: 'Demigaroto' },
  { key: 'demigender', label: 'Demigênero' },
  { key: 'neutrois', label: 'Neutrois' },
  { key: 'androgyne', label: 'Andrógine' },
  { key: 'intergender', label: 'Intergênero' },
  { key: 'maverique', label: 'Maverique' },
  { key: 'xenogender', label: 'Xenogênero' },
  { key: 'two_spirit', label: 'Dois-espíritos (Two-Spirit)' },
  { key: 'questioning', label: 'Questionando' },
  { key: 'prefer_not', label: 'Prefiro não dizer' },
] as const

export type GenderKey = (typeof GENDER_OPTIONS)[number]['key']

const CUSTOM_PREFIX = 'custom:'
export const MAX_CUSTOM_GENDER = 40

export function customGender(text: string): string {
  return CUSTOM_PREFIX + text.trim()
}

/** Texto pra mostrar ("Mulher trans", ou o que a pessoa escreveu no Outro). */
export function genderLabel(value: string | null | undefined): string | null {
  if (!value) return null
  if (value.startsWith(CUSTOM_PREFIX)) return value.slice(CUSTOM_PREFIX.length) || null
  return GENDER_OPTIONS.find((g) => g.key === value)?.label ?? null
}

export function isCustomGender(value: string | null | undefined): boolean {
  return !!value && value.startsWith(CUSTOM_PREFIX)
}

/** null = válido. Aceita key da lista, custom:texto (até 40 caracteres) ou vazio pra limpar. */
export function validateGender(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') return 'gênero inválido'
  if (value.startsWith(CUSTOM_PREFIX)) {
    const text = value.slice(CUSTOM_PREFIX.length).trim()
    if (!text) return 'escreva seu gênero'
    if (text.length > MAX_CUSTOM_GENDER) return `gênero com no máximo ${MAX_CUSTOM_GENDER} caracteres`
    return null
  }
  return GENDER_OPTIONS.some((g) => g.key === value) ? null : 'gênero inválido'
}

// ---- notificações ----

export const NOTIFICATION_KINDS = [
  { key: 'doseReminders', label: 'Hora da dose', hint: 'Aviso no horário de cada remédio', push: true },
  { key: 'doseFollowup', label: '"Você tomou?"', hint: 'Pergunta uma hora depois, se a dose não foi marcada', push: true },
  { key: 'insights', label: 'Resumo do dia', hint: 'Um recado por dia na caixa de entrada sobre humor e doses', push: false },
  { key: 'achievements', label: 'Conquistas e títulos', hint: 'Quando você desbloqueia troféus e títulos novos', push: false },
] as const

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number]['key']
export type NotificationPrefs = Partial<Record<NotificationKind, boolean>>

/** Chave ausente = ligada (o padrão é receber tudo). */
export function wantsNotification(prefs: unknown, kind: NotificationKind): boolean {
  if (!prefs || typeof prefs !== 'object') return true
  return (prefs as Record<string, unknown>)[kind] !== false
}

export function validateNotificationPrefs(value: unknown): string | null {
  if (value === undefined) return null
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'preferências de notificação inválidas'
  const known = new Set<string>(NOTIFICATION_KINDS.map((k) => k.key))
  for (const [k, v] of Object.entries(value)) {
    if (!known.has(k) || typeof v !== 'boolean') return 'preferências de notificação inválidas'
  }
  return null
}

// ---- foco das medidas ----

/** 'lower' = foco em inferiores (quadril, coxa…), 'upper' = superiores (peito, ombros, braços), 'combined' = todas.
 * Os valores antigos 'feminine'/'masculine' ainda aparecem em perfis de antes e valem como lower/upper. */
export const MEASUREMENT_FOCUS = ['lower', 'upper', 'combined'] as const
const LEGACY_FOCUS = ['feminine', 'masculine']

export function validateMeasurementFocus(value: unknown): string | null {
  if (value === undefined) return null
  if (typeof value === 'string' && ((MEASUREMENT_FOCUS as readonly string[]).includes(value) || LEGACY_FOCUS.includes(value))) return null
  return 'foco de medidas inválido'
}

export function normalizeMeasurementFocus(value: string | null | undefined): (typeof MEASUREMENT_FOCUS)[number] {
  if (value === 'lower' || value === 'feminine') return 'lower'
  if (value === 'upper' || value === 'masculine') return 'upper'
  return 'combined'
}
