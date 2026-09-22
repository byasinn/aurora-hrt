import type { WorkoutExercise } from '../../shared/types'

export interface WorkoutTemplate {
  key: string
  title: string
  focus: string
  icon: string
  daysOfWeek: number[] // 0=dom..6=sáb
  exercises: WorkoutExercise[]
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    key: 'bumbum_gigante',
    title: 'Bumbum gigante',
    focus: 'Glúteos',
    icon: 'dumbbell',
    daysOfWeek: [1, 3, 5],
    exercises: [
      { name: 'Elevação de quadril (hip thrust)', sets: 4, reps: '15' },
      { name: 'Agachamento sumô', sets: 4, reps: '15' },
      { name: 'Afundo alternado', sets: 3, reps: '12 cada perna' },
      { name: 'Coice (glúteo kickback)', sets: 3, reps: '15 cada lado' },
      { name: 'Ponte unilateral', sets: 3, reps: '12 cada lado' },
      { name: 'Abdução de quadril deitada', sets: 3, reps: '20 cada lado' },
    ],
  },
  {
    key: 'coxuda',
    title: 'Coxuda',
    focus: 'Pernas',
    icon: 'footprints',
    daysOfWeek: [2, 4, 6],
    exercises: [
      { name: 'Agachamento livre', sets: 4, reps: '15' },
      { name: 'Agachamento búlgaro', sets: 3, reps: '12 cada perna' },
      { name: 'Levantamento terra romeno', sets: 4, reps: '12' },
      { name: 'Passada (step-up)', sets: 3, reps: '12 cada perna' },
      { name: 'Panturrilha em pé', sets: 4, reps: '20' },
      { name: 'Cadeira extensora ou agachamento isométrico', sets: 3, reps: '30s' },
    ],
  },
  {
    key: 'cinturinha_vem_ai',
    title: 'Cinturinha vem aí',
    focus: 'Cintura e abdômen',
    icon: 'target',
    daysOfWeek: [1, 2, 4, 5],
    exercises: [
      { name: 'Prancha abdominal', sets: 3, reps: '40s' },
      { name: 'Bicicleta (crunch cruzado)', sets: 3, reps: '20 cada lado' },
      { name: 'Rotação russa', sets: 3, reps: '20' },
      { name: 'Prancha lateral', sets: 3, reps: '30s cada lado' },
      { name: 'Elevação de pernas deitada', sets: 3, reps: '15' },
      { name: 'Vacuum abdominal', sets: 3, reps: '15s' },
    ],
  },
  {
    key: 'postura',
    title: 'Postura',
    focus: 'Mobilidade e treinos leves',
    icon: 'wind',
    daysOfWeek: [1, 2, 3, 4, 5],
    exercises: [
      { name: 'Alongamento de peitoral na parede', sets: 2, reps: '30s cada lado' },
      { name: 'Retração escapular (remada isométrica)', sets: 3, reps: '15' },
      { name: 'Gato-camelo', sets: 2, reps: '10' },
      { name: 'Alongamento de trapézio', sets: 2, reps: '30s cada lado' },
      { name: 'Prancha com apoio nos joelhos', sets: 2, reps: '20s' },
      { name: 'Respiração diafragmática', sets: 2, reps: '1min' },
    ],
  },
  {
    key: 'elastica',
    title: 'Elástica',
    focus: 'Mobilidade avançada',
    icon: 'star',
    daysOfWeek: [2, 4, 6],
    exercises: [
      { name: 'Agachamento profundo com pausa', sets: 3, reps: '30s' },
      { name: 'Mobilidade de quadril 90/90', sets: 3, reps: '8 cada lado' },
      { name: 'Cachorro olhando pro céu/chão (flow)', sets: 3, reps: '8' },
      { name: 'Alongamento de isquiotibiais em pé', sets: 3, reps: '30s cada lado' },
      { name: 'Ponte completa', sets: 3, reps: '20s' },
      { name: 'Borboleta', sets: 3, reps: '40s' },
    ],
  },
  {
    key: 'sou_flexivel',
    title: 'Sou flexível',
    focus: 'Mobilidade para sexo',
    icon: 'heart',
    daysOfWeek: [0, 1, 3],
    exercises: [
      { name: 'Alongamento de quadril (pombo)', sets: 3, reps: '40s cada lado' },
      { name: 'Afundo com rotação de tronco', sets: 3, reps: '8 cada lado' },
      { name: 'Borboleta com pressão progressiva', sets: 3, reps: '40s' },
      { name: 'Cobra (alongamento de lombar)', sets: 3, reps: '20s' },
      { name: 'Avanço com alongamento de isquiotibial', sets: 3, reps: '30s cada lado' },
      { name: 'Respiração e relaxamento pélvico', sets: 2, reps: '1min' },
    ],
  },
]

export function getWorkoutTemplate(key: string): WorkoutTemplate | undefined {
  return WORKOUT_TEMPLATES.find((t) => t.key === key)
}

/** Programas criados a partir de um preset sempre usam o ícone ATUAL do preset — evita ícone velho preso num programa já criado. */
export function resolveProgramIcon(program: { icon: string; templateKey?: string | null }): string {
  if (program.templateKey) {
    const template = getWorkoutTemplate(program.templateKey)
    if (template) return template.icon
  }
  return program.icon
}
