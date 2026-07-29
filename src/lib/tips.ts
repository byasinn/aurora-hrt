export type TipCategory = 'injection' | 'oral' | 'patch_gel' | 'feminine' | 'masculine' | 'mental_health' | 'general'

export interface Tip {
  category: TipCategory
  icon: string
  text: string
}

export const TIPS: Tip[] = [
  // Injeção
  {
    category: 'injection',
    icon: '💉',
    text: 'Alterne o local da aplicação a cada dose (ex: coxa direita, depois esquerda) para evitar acúmulo de tecido no mesmo ponto ao longo do tempo.',
  },
  {
    category: 'injection',
    icon: '💉',
    text: 'Deixar o frasco em temperatura ambiente por alguns minutos antes de aplicar costuma reduzir o desconforto da injeção gelada.',
  },
  {
    category: 'injection',
    icon: '💉',
    text: 'Descarte agulhas usadas em um recipiente rígido e fechado (uma garrafa PET grossa resolve), nunca direto no lixo comum.',
  },

  // Oral
  {
    category: 'oral',
    icon: '💊',
    text: 'Tomar sempre no mesmo horário ajuda a manter os níveis hormonais mais estáveis ao longo do dia.',
  },
  {
    category: 'oral',
    icon: '💊',
    text: 'Se esquecer uma dose, converse com seu médico sobre a orientação certa — nem sempre o indicado é dobrar a próxima.',
  },

  // Adesivo / gel
  {
    category: 'patch_gel',
    icon: '🩹',
    text: 'Alterne o local do adesivo ou gel a cada aplicação para evitar irritação na pele na mesma região.',
  },
  {
    category: 'patch_gel',
    icon: '🧴',
    text: 'Espere o gel secar completamente antes de vestir roupa, e evite contato de outras pessoas com a área por algumas horas.',
  },

  // Feminizante
  {
    category: 'feminine',
    icon: '🌸',
    text: 'Mudanças na pele e sensibilidade nos seios são comuns no início da terapia e costumam se estabilizar com o tempo.',
  },
  {
    category: 'feminine',
    icon: '🌸',
    text: 'As mudanças físicas seguem o próprio ritmo de cada corpo — comparar sua linha do tempo com a de outras pessoas raramente ajuda.',
  },

  // Masculinizante
  {
    category: 'masculine',
    icon: '💪',
    text: 'O aumento de oleosidade na pele é comum com testosterona — produtos com hamamélis (witch hazel) ajudam a controlar sem ressecar demais.',
  },
  {
    category: 'masculine',
    icon: '💪',
    text: 'Mudanças na voz costumam ser progressivas ao longo de meses — praticar exercícios vocais com paciência faz diferença.',
  },

  // Saúde mental
  {
    category: 'mental_health',
    icon: '💜',
    text: 'Ter apoio psicológico afirmativo (que entenda e respeite sua identidade) está associado a menos ansiedade e mais bem-estar durante a transição.',
  },
  {
    category: 'mental_health',
    icon: '💜',
    text: 'Sentir altos e baixos emocionais durante a transição é normal — você não precisa enfrentar isso sozinha/o.',
  },

  // Geral / exames
  {
    category: 'general',
    icon: '🧪',
    text: 'Exames de sangue periódicos ajudam você e seu médico a ajustar a dose com segurança — registrar os resultados aqui facilita mostrar a evolução na consulta.',
  },
  {
    category: 'general',
    icon: '⚠️',
    text: 'Se você toma espironolactona, vale conversar com seu médico sobre acompanhar os níveis de potássio regularmente.',
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
