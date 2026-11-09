// Missões (aba Missões, na central do Aurora). Cada uma dá um baú ao resgatar. As de "começando" são
// uma vez só; as da semana voltam toda segunda. O servidor confere tudo antes de dar o baú
// (worker/routes/rewards.ts) — a lista aqui é só o que é e quanto falta.

export type ChestRarity = 'common' | 'rare'

export interface MissionDef {
  key: string
  group: 'starter' | 'weekly'
  title: string
  description: string
  target: number
  rarity: ChestRarity
  /** caminho no app pra ir fazer */
  to: string
}

export const STARTER_MISSIONS: MissionDef[] = [
  { key: 'first_med', group: 'starter', title: 'Adicione um remédio', description: 'Cadastre o que você toma pra receber lembretes.', target: 1, rarity: 'common', to: '/' },
  { key: 'first_routine', group: 'starter', title: 'Crie uma rotina', description: 'Skincare, água, alongar… o que fizer sentido pra você.', target: 1, rarity: 'common', to: '/routines' },
  { key: 'avatar', group: 'starter', title: 'Coloque uma foto de perfil', description: 'Pode ser você, seu pet ou o que quiser.', target: 1, rarity: 'common', to: '/settings/perfil' },
  { key: 'join_community', group: 'starter', title: 'Entre numa comunidade', description: 'Ache um grupo com gente que entende.', target: 1, rarity: 'common', to: '/comunidades' },
  { key: 'first_post', group: 'starter', title: 'Poste alguma coisa', description: 'No Explorar ou numa comunidade.', target: 1, rarity: 'common', to: '/feed' },
  { key: 'all_starter', group: 'starter', title: 'Complete todas as primeiras missões', description: 'Ganha um baú raro.', target: 5, rarity: 'rare', to: '/missoes' },
]

export const WEEKLY_MISSIONS: MissionDef[] = [
  { key: 'w_daylog', group: 'weekly', title: 'Registre seu dia 5 vezes', description: 'Humor, energia, libido ou notas — no dia.', target: 5, rarity: 'common', to: '/dia' },
  { key: 'w_routines', group: 'weekly', title: 'Faça suas rotinas em 5 dias', description: 'Qualquer rotina concluída conta pro dia.', target: 5, rarity: 'common', to: '/routines' },
  { key: 'w_meds', group: 'weekly', title: 'Remédios em dia a semana toda', description: 'Todas as doses previstas até hoje, marcadas no dia.', target: 1, rarity: 'common', to: '/' },
  { key: 'w_workout', group: 'weekly', title: 'Bata a meta de treinos', description: 'Todos os treinos planejados da semana.', target: 1, rarity: 'common', to: '/treinos' },
  { key: 'w_social', group: 'weekly', title: 'Interaja 5 vezes', description: 'Curtir, comentar ou postar.', target: 5, rarity: 'common', to: '/feed' },
]

/** Fonte do baú de streak — um a cada 7 dias seguidos abrindo o app. */
export const STREAK_CHEST_EVERY = 7

export interface MissionState extends MissionDef {
  progress: number
  /** missão não se aplica (ex.: treino sem programa ativo) */
  hidden: boolean
  claimed: boolean
  /** source do baú, igual o salvo em chests.source */
  source: string
}

export interface ChestContents {
  brilho: number
  potions: number
  itemKey: string | null
}

export interface ChestView {
  id: number
  source: string
  rarity: ChestRarity
  contents: ChestContents | null
  openedAt: string | null
  createdAt: string
}

export function chestLabel(source: string): string {
  if (source.startsWith('streak')) return 'Streak de 7 dias'
  const key = source.startsWith('w:') ? source.split(':')[2] : source.slice(2)
  return [...STARTER_MISSIONS, ...WEEKLY_MISSIONS].find((m) => m.key === key)?.title ?? 'Baú'
}
