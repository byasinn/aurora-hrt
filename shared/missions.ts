// Missões (aba Missões, na central do Aurora). As de boas-vindas ficam aqui no código e são uma vez
// só; as diárias e semanais ficam no banco (tabela missions) e o admin cria/edita pelo painel. O
// servidor confere tudo antes de dar a recompensa (worker/routes/rewards.ts).

export type ChestRarity = 'common' | 'rare'
export type MissionPeriod = 'daily' | 'weekly'
export type RewardKind = 'chest' | 'brilho' | 'potion'

export interface StarterMissionDef {
  key: string
  title: string
  description: string
  target: number
  rarity: ChestRarity
  to: string
}

export const STARTER_MISSIONS: StarterMissionDef[] = [
  { key: 'first_med', title: 'Adicione um remédio', description: 'Cadastre o que você toma pra receber lembretes.', target: 1, rarity: 'common', to: '/' },
  { key: 'first_routine', title: 'Crie uma rotina', description: 'Skincare, água, alongar… o que fizer sentido pra você.', target: 1, rarity: 'common', to: '/routines' },
  { key: 'avatar', title: 'Coloque uma foto de perfil', description: 'Pode ser você, seu pet ou o que quiser.', target: 1, rarity: 'common', to: '/settings/perfil' },
  { key: 'forum', title: 'Passe na Comunidade', description: 'Abra um tópico ou responda alguém.', target: 1, rarity: 'common', to: '/comunidades' },
  { key: 'first_post', title: 'Poste alguma coisa', description: 'Uma foto ou texto no Explorar.', target: 1, rarity: 'common', to: '/feed' },
  { key: 'all_starter', title: 'Complete as boas-vindas', description: 'Ganha um baú raro e libera as missões diárias.', target: 5, rarity: 'rare', to: '/missoes' },
]

/** O que uma missão diária/semanal pode medir — o servidor sabe contar cada uma no dia e na semana. */
export const MISSION_METRICS = {
  daylog: { label: 'Dias com registro do dia', unit: 'dia' },
  routines_done: { label: 'Rotinas concluídas', unit: 'rotina' },
  routine_days: { label: 'Dias com rotina feita', unit: 'dia' },
  meds_on_time: { label: 'Remédios em dia (hoje ou a semana toda)', unit: '' },
  workouts: { label: 'Treinos feitos', unit: 'treino' },
  workout_goal: { label: 'Meta de treinos da semana', unit: '' },
  likes: { label: 'Curtidas dadas', unit: 'curtida' },
  comments: { label: 'Comentários', unit: 'comentário' },
  posts: { label: 'Posts', unit: 'post' },
  social: { label: 'Interações (curtir, comentar, postar)', unit: 'interação' },
  forum: { label: 'Tópicos ou respostas na Comunidade', unit: '' },
  visits: { label: 'Dias abrindo o app', unit: 'dia' },
} as const

export type MissionMetric = keyof typeof MISSION_METRICS

export interface MissionDefInput {
  period: MissionPeriod
  metric: MissionMetric
  target: number
  title: string
  description: string
  rewardKind: RewardKind
  rewardRarity: ChestRarity
  rewardAmount: number
  active: boolean
  sortOrder: number
}

/** Missões criadas no banco na primeira vez (o admin edita a partir daí). Diárias dão pouco Brilho
 * direto — baú todo dia inflaria a lojinha; as semanais dão baú. */
export const DEFAULT_MISSIONS: MissionDefInput[] = [
  { period: 'daily', metric: 'daylog', target: 1, title: 'Registre seu dia', description: 'Humor, energia, libido ou notas.', rewardKind: 'brilho', rewardRarity: 'common', rewardAmount: 3, active: true, sortOrder: 1 },
  { period: 'daily', metric: 'routines_done', target: 1, title: 'Conclua uma rotina', description: 'Qualquer rotina de hoje.', rewardKind: 'brilho', rewardRarity: 'common', rewardAmount: 3, active: true, sortOrder: 2 },
  { period: 'daily', metric: 'meds_on_time', target: 1, title: 'Remédios de hoje em dia', description: 'Todas as doses de hoje marcadas.', rewardKind: 'brilho', rewardRarity: 'common', rewardAmount: 3, active: true, sortOrder: 3 },
  { period: 'daily', metric: 'social', target: 3, title: 'Interaja 3 vezes', description: 'Curtir, comentar ou postar.', rewardKind: 'brilho', rewardRarity: 'common', rewardAmount: 3, active: true, sortOrder: 4 },
  { period: 'weekly', metric: 'daylog', target: 5, title: 'Registre seu dia 5 vezes', description: 'No dia, não depois.', rewardKind: 'chest', rewardRarity: 'common', rewardAmount: 0, active: true, sortOrder: 1 },
  { period: 'weekly', metric: 'routine_days', target: 5, title: 'Faça suas rotinas em 5 dias', description: 'Qualquer rotina concluída conta pro dia.', rewardKind: 'chest', rewardRarity: 'common', rewardAmount: 0, active: true, sortOrder: 2 },
  { period: 'weekly', metric: 'meds_on_time', target: 1, title: 'Remédios em dia a semana toda', description: 'Todas as doses da semana marcadas no dia — libera no domingo.', rewardKind: 'chest', rewardRarity: 'common', rewardAmount: 0, active: true, sortOrder: 3 },
  { period: 'weekly', metric: 'workout_goal', target: 1, title: 'Bata a meta de treinos', description: 'Todos os treinos planejados da semana.', rewardKind: 'chest', rewardRarity: 'common', rewardAmount: 0, active: true, sortOrder: 4 },
  { period: 'weekly', metric: 'social', target: 10, title: 'Interaja 10 vezes', description: 'Curtir, comentar ou postar.', rewardKind: 'chest', rewardRarity: 'common', rewardAmount: 0, active: true, sortOrder: 5 },
]

/** Fonte do baú de streak — um a cada 7 dias seguidos abrindo o app. */
export const STREAK_CHEST_EVERY = 7

export interface MissionState {
  /** 'starter:<key>' ou o id da missão no banco */
  key: string
  group: 'starter' | MissionPeriod
  title: string
  description: string
  target: number
  progress: number
  rewardKind: RewardKind
  rewardRarity: ChestRarity
  rewardAmount: number
  to: string
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

export type StreakDay = { date: string; status: 'fire' | 'rest' | 'missed' | 'pending' | 'none' | 'future' }

export function rewardLabel(m: Pick<MissionState, 'rewardKind' | 'rewardRarity' | 'rewardAmount'>): string {
  if (m.rewardKind === 'brilho') return `+${m.rewardAmount} Brilho`
  if (m.rewardKind === 'potion') return `+${m.rewardAmount} poção`
  return m.rewardRarity === 'rare' ? 'Baú raro' : 'Baú'
}

/** Rótulo do baú a partir da fonte (o título da missão vai junto na fonte das missões do banco). */
export function chestLabel(source: string): string {
  if (source.startsWith('streak')) return 'Streak de 7 dias'
  if (source.startsWith('m:')) return STARTER_MISSIONS.find((m) => m.key === source.slice(2))?.title ?? 'Boas-vindas'
  if (source.startsWith('d:')) return 'Missão diária'
  if (source.startsWith('w:')) return 'Missão semanal'
  return 'Baú'
}
