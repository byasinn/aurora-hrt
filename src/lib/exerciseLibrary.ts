export type MuscleGroup = 'gluteos' | 'pernas' | 'costas' | 'peito' | 'ombros' | 'bracos' | 'abdomen' | 'mobilidade' | 'cardio'

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  gluteos: 'Glúteos',
  pernas: 'Pernas',
  costas: 'Costas',
  peito: 'Peito',
  ombros: 'Ombros',
  bracos: 'Braços',
  abdomen: 'Abdômen',
  mobilidade: 'Mobilidade',
  cardio: 'Cardio',
}

export interface LibraryExercise {
  name: string
  group: MuscleGroup
}

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Glúteos
  { name: 'Elevação de quadril (hip thrust)', group: 'gluteos' },
  { name: 'Agachamento sumô', group: 'gluteos' },
  { name: 'Coice (glúteo kickback)', group: 'gluteos' },
  { name: 'Ponte unilateral', group: 'gluteos' },
  { name: 'Abdução de quadril deitada', group: 'gluteos' },
  { name: 'Abdução no cabo/elástico', group: 'gluteos' },
  { name: 'Cadeira abdutora', group: 'gluteos' },
  { name: 'Stiff unilateral', group: 'gluteos' },

  // Pernas
  { name: 'Agachamento livre', group: 'pernas' },
  { name: 'Agachamento búlgaro', group: 'pernas' },
  { name: 'Levantamento terra romeno', group: 'pernas' },
  { name: 'Passada (step-up)', group: 'pernas' },
  { name: 'Afundo alternado', group: 'pernas' },
  { name: 'Panturrilha em pé', group: 'pernas' },
  { name: 'Cadeira extensora', group: 'pernas' },
  { name: 'Mesa flexora', group: 'pernas' },
  { name: 'Leg press', group: 'pernas' },
  { name: 'Agachamento isométrico na parede', group: 'pernas' },

  // Costas
  { name: 'Remada curvada', group: 'costas' },
  { name: 'Puxada frontal', group: 'costas' },
  { name: 'Remada unilateral (serrote)', group: 'costas' },
  { name: 'Barra fixa (ou assistida)', group: 'costas' },
  { name: 'Levantamento terra', group: 'costas' },
  { name: 'Superman', group: 'costas' },
  { name: 'Remada baixa (cabo)', group: 'costas' },

  // Peito
  { name: 'Supino reto', group: 'peito' },
  { name: 'Supino inclinado', group: 'peito' },
  { name: 'Flexão de braço', group: 'peito' },
  { name: 'Crucifixo', group: 'peito' },
  { name: 'Crossover no cabo', group: 'peito' },

  // Ombros
  { name: 'Desenvolvimento com halteres', group: 'ombros' },
  { name: 'Elevação lateral', group: 'ombros' },
  { name: 'Elevação frontal', group: 'ombros' },
  { name: 'Remada alta', group: 'ombros' },
  { name: 'Face pull', group: 'ombros' },

  // Braços
  { name: 'Rosca direta', group: 'bracos' },
  { name: 'Rosca alternada', group: 'bracos' },
  { name: 'Tríceps corda (cabo)', group: 'bracos' },
  { name: 'Tríceps testa', group: 'bracos' },
  { name: 'Mergulho no banco (dips)', group: 'bracos' },

  // Abdômen
  { name: 'Prancha abdominal', group: 'abdomen' },
  { name: 'Prancha lateral', group: 'abdomen' },
  { name: 'Bicicleta (crunch cruzado)', group: 'abdomen' },
  { name: 'Rotação russa', group: 'abdomen' },
  { name: 'Elevação de pernas deitada', group: 'abdomen' },
  { name: 'Vacuum abdominal', group: 'abdomen' },
  { name: 'Abdominal infra no banco', group: 'abdomen' },

  // Mobilidade
  { name: 'Gato-camelo', group: 'mobilidade' },
  { name: 'Alongamento de peitoral na parede', group: 'mobilidade' },
  { name: 'Retração escapular (remada isométrica)', group: 'mobilidade' },
  { name: 'Alongamento de trapézio', group: 'mobilidade' },
  { name: 'Respiração diafragmática', group: 'mobilidade' },
  { name: 'Mobilidade de quadril 90/90', group: 'mobilidade' },
  { name: 'Cachorro olhando pro céu/chão (flow)', group: 'mobilidade' },
  { name: 'Alongamento de isquiotibiais em pé', group: 'mobilidade' },
  { name: 'Ponte completa', group: 'mobilidade' },
  { name: 'Borboleta', group: 'mobilidade' },
  { name: 'Alongamento de quadril (pombo)', group: 'mobilidade' },
  { name: 'Afundo com rotação de tronco', group: 'mobilidade' },
  { name: 'Cobra (alongamento de lombar)', group: 'mobilidade' },
  { name: 'Avanço com alongamento de isquiotibial', group: 'mobilidade' },
  { name: 'Respiração e relaxamento pélvico', group: 'mobilidade' },

  // Cardio
  { name: 'Corda (pular)', group: 'cardio' },
  { name: 'Polichinelo', group: 'cardio' },
  { name: 'Escalador (mountain climber)', group: 'cardio' },
  { name: 'Burpee', group: 'cardio' },
  { name: 'Corrida estacionária', group: 'cardio' },
]

export function searchExerciseLibrary(query: string, group?: MuscleGroup | null): LibraryExercise[] {
  const q = query.trim().toLowerCase()
  return EXERCISE_LIBRARY.filter((e) => {
    if (group && e.group !== group) return false
    if (q && !e.name.toLowerCase().includes(q)) return false
    return true
  })
}
