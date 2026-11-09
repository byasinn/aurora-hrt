import { dateStrInTimezone, isDueOnDate, type SchedulableMedication } from './scheduling'

// Brilho v2 — regras de pontos num lugar só (o Worker calcula com isso; a tela de Brilho explica com
// as mesmas constantes). Ideia geral:
// - vale o que é marcado NO DIA. Marcou depois (o "e ontem, fez?", doses de dias atrás) fica no
//   histórico mas não dá Brilho — a não ser que a pessoa use uma Poção do tempo naquele dia.
// - remédio e treino pagam por semana completa, não por dose/sessão.
// - rotina paga pouco por dia, ou (modo aposta) +50% no fim da semana só se fez todo dia.
// - social tem teto diário, e criar/apagar coisa não dá ponto nenhum.

export const POINTS = {
  dayLog: { mood: 2, energy: 1, libido: 1, symptoms: 1, notes: 2 },
  routinePerDay: 2,
  routinesCountedPerDay: 5, // no máximo 5 rotinas por dia contam (10 Brilho/dia)
  routineBetMultiplier: 1.5,
  medWeek: 20, // por remédio, por semana tomada certinho
  medMaxWeeksPerDose: 5, // aplicação mensal (28-35 dias) vale até 5 semanas
  workoutWeek: 35, // bateu a meta de treinos da semana
  like: 1,
  comment: 2,
  post: 3,
  socialDailyCap: 20,
  visit: 2, // abrir o app no dia (popup do streak)
} as const

export const MAX_ROUTINES = 15
/** Até quantos dias pra trás dá pra marcar doses esquecidas (e usar poção). */
export const BACKFILL_DAYS = 10
/** Até que horas da madrugada o "ontem" ainda vale como no dia (quem marca a rotina à 1h da manhã). */
export const LATE_GRACE_HOURS = 6

export function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T12:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Segunda-feira da semana da data (semanas vão de segunda a domingo). */
export function weekStartOf(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00.000Z`)
  const dow = d.getUTCDay() // 0=dom
  return addDays(dateStr, dow === 0 ? -6 : 1 - dow)
}

export function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00.000Z`).getUTCDay()
}

/** O "dia" a que um instante pertence, com a folga da madrugada. */
export function effectiveDate(at: Date, timeZone: string): string {
  return dateStrInTimezone(new Date(at.getTime() - LATE_GRACE_HOURS * 3_600_000), timeZone)
}

/** Registro do dia `dateStr` feito em `at` foi feito depois do dia (não vale Brilho)? */
export function isLate(dateStr: string, at: Date, timeZone: string): boolean {
  return dateStr < effectiveDate(at, timeZone)
}

export function routineIsDone(routine: { type: string; targetCount: number | null }, count: number): boolean {
  return routine.type === 'checkbox' ? count > 0 : routine.targetCount != null && count >= routine.targetCount
}

export function routineDueOn(routine: { daysOfWeek: unknown }, dateStr: string): boolean {
  const days = routine.daysOfWeek as number[] | null
  return days == null || days.includes(weekdayOf(dateStr))
}

/** Quantos treinos por semana a pessoa planejou (soma dos dias dos programas ativos, 1 a 7). */
export function workoutWeeklyGoal(programs: { active: boolean; days: { daysOfWeek: unknown }[] }[]): number {
  const slots = programs.filter((p) => p.active).reduce((sum, p) => sum + p.days.reduce((s, d) => s + ((d.daysOfWeek as number[] | null) ?? []).length, 0), 0)
  return Math.max(0, Math.min(7, slots))
}

export interface PointsInput {
  today: string
  since: string
  timeZone: string
  rescued: Set<string>
  moods: { date: string; createdAt: Date; moodTagIds: unknown; symptomTagIds: unknown; energyLevel: number | null; libidoLevel: number | null; notes: string | null }[]
  dayNotes: { date: string; createdAt: Date; note: string }[]
  routines: { id: number; name: string; type: string; targetCount: number | null; daysOfWeek: unknown; createdAt: Date }[]
  routineLogs: { routineId: number; date: string; count: number; createdAt: Date }[]
  betWeeks: Set<string>
  workoutGoal: number
  workoutLogs: { workoutDayId: number; date: string; createdAt: Date }[]
  meds: (SchedulableMedication & { id: number; name: string; createdAt: Date })[]
  doseLogs: { medicationId: number; scheduledFor: Date; status: string; backfilled: boolean }[]
  social: { kind: 'like' | 'comment' | 'post'; createdAt: Date }[]
}

export interface MedWeekProgress {
  medicationId: number
  name: string
  doneDays: number
  dueDays: number
}

export interface PointsBreakdown {
  dayLog: number
  routines: number
  routineBets: number
  meds: number
  workouts: number
  social: number
}

export interface WeekProgress {
  weekStart: string
  dayLogDays: number
  dayLogPoints: number
  routineDays: number
  routinePoints: number
  betActive: boolean
  /** rotinas apostadas nessa semana que ainda estão perfeitas até hoje */
  betOnTrack: { routineId: number; name: string; onTrack: boolean }[]
  meds: MedWeekProgress[]
  medsAllOnTrack: boolean
  workoutsDone: number
  workoutGoal: number
  socialToday: number
  socialWeekActions: number
}

export interface PointsResult {
  breakdown: PointsBreakdown
  activity: number
  week: WeekProgress
  workoutGoalWeeks: number
}

export function computeActivityPoints(input: PointsInput): PointsResult {
  const { today, since, timeZone, rescued } = input
  const onTime = (date: string, createdAt: Date) => date >= since && date <= today && (!isLate(date, createdAt, timeZone) || rescued.has(date))
  const currentWeek = weekStartOf(today)

  // --- registro do dia: mais detalhe, mais ponto ---
  const P = POINTS.dayLog
  const dayLogByDate = new Map<string, number>()
  const notesDates = new Set(input.dayNotes.filter((n) => n.note.trim() && onTime(n.date, n.createdAt)).map((n) => n.date))
  for (const m of input.moods) {
    if (!onTime(m.date, m.createdAt)) continue
    let pts = 0
    if (((m.moodTagIds as number[] | null) ?? []).length > 0) pts += P.mood
    if (m.energyLevel != null) pts += P.energy
    if (m.libidoLevel != null) pts += P.libido
    if (((m.symptomTagIds as number[] | null) ?? []).length > 0) pts += P.symptoms
    if (m.notes?.trim()) notesDates.add(m.date)
    dayLogByDate.set(m.date, pts)
  }
  for (const d of notesDates) dayLogByDate.set(d, (dayLogByDate.get(d) ?? 0) + P.notes)
  let dayLog = 0
  let dayLogWeekDays = 0
  let dayLogWeekPoints = 0
  for (const [date, pts] of dayLogByDate) {
    dayLog += pts
    if (date >= currentWeek && pts > 0) {
      dayLogWeekDays++
      dayLogWeekPoints += pts
    }
  }

  // --- rotinas ---
  const routineById = new Map(input.routines.map((r) => [r.id, r]))
  const doneOnTime = new Set<string>() // `${routineId}:${date}`
  for (const l of input.routineLogs) {
    const r = routineById.get(l.routineId)
    if (r && routineIsDone(r, l.count) && onTime(l.date, l.createdAt)) doneOnTime.add(`${l.routineId}:${l.date}`)
  }
  const routinesPerDay = new Map<string, number>()
  for (const key of doneOnTime) {
    const date = key.slice(key.indexOf(':') + 1)
    if (input.betWeeks.has(weekStartOf(date))) continue // semana apostada paga no fim
    routinesPerDay.set(date, (routinesPerDay.get(date) ?? 0) + 1)
  }
  let routines = 0
  let routineWeekPoints = 0
  for (const [date, n] of routinesPerDay) {
    const pts = Math.min(n, POINTS.routinesCountedPerDay) * POINTS.routinePerDay
    routines += pts
    if (date >= currentWeek) routineWeekPoints += pts
  }
  const routineWeekDays = new Set([...doneOnTime].map((k) => k.slice(k.indexOf(':') + 1)).filter((d) => d >= currentWeek)).size

  // aposta: cada rotina vale sozinha — fez em todos os dias previstos da semana, ganha 1,5x; furou um, zero
  function betEvaluation(weekStart: string, until: string) {
    return input.routines
      .map((r) => {
        const created = dateStrInTimezone(r.createdAt, timeZone)
        let due = 0
        let done = 0
        for (let i = 0; i < 7; i++) {
          const d = addDays(weekStart, i)
          if (d > until || d < since || d < created || !routineDueOn(r, d)) continue
          due++
          if (doneOnTime.has(`${r.id}:${d}`)) done++
        }
        return { routine: r, due, done }
      })
      .filter((e) => e.due > 0)
  }
  let routineBets = 0
  for (const week of input.betWeeks) {
    const weekEnd = addDays(week, 6)
    if (weekEnd >= today) continue // ainda não acabou
    const perfect = betEvaluation(week, weekEnd)
      .filter((e) => e.done === e.due)
      .map((e) => Math.round(e.due * POINTS.routinePerDay * POINTS.routineBetMultiplier))
      .sort((a, b) => b - a)
      .slice(0, POINTS.routinesCountedPerDay)
    routineBets += perfect.reduce((s, p) => s + p, 0)
  }
  const betActive = input.betWeeks.has(currentWeek)
  // até ontem tem que estar perfeito; hoje ainda dá tempo
  const betOnTrack = betActive
    ? betEvaluation(currentWeek, today).map((e) => ({
        routineId: e.routine.id,
        name: e.routine.name,
        onTrack: e.done >= e.due - (doneOnTime.has(`${e.routine.id}:${today}`) || !routineDueOn(e.routine, today) ? 0 : 1),
      }))
    : []

  // --- remédios: por semana tomada certinho ---
  const takenByMedDay = new Map<string, number>() // `${medId}:${date}` -> doses no dia que valem
  for (const l of input.doseLogs) {
    if (l.status !== 'taken') continue
    const date = dateStrInTimezone(new Date(l.scheduledFor), timeZone)
    if (date < since || (l.backfilled && !rescued.has(date))) continue
    const key = `${l.medicationId}:${date}`
    takenByMedDay.set(key, (takenByMedDay.get(key) ?? 0) + 1)
  }
  let meds = 0
  const medWeek: MedWeekProgress[] = []
  for (const med of input.meds) {
    const created = dateStrInTimezone(med.createdAt, timeZone)
    const start = since > created ? since : created
    if (start > today) continue
    const perDay = Math.max(1, med.preferredTimes?.length ?? 1)
    const interval = med.frequencyType === 'every_n_days' ? ((med.frequencyValue as { intervalDays?: number })?.intervalDays ?? 1) : 1
    const tookOn = (d: string) => (takenByMedDay.get(`${med.id}:${d}`) ?? 0) >= perDay

    if (interval >= 7) {
      // aplicação semanal/quinzenal/mensal: cada aplicação no dia vale as semanas que ela cobre
      const worth = POINTS.medWeek * Math.min(interval / 7, POINTS.medMaxWeeksPerDose)
      for (let d = start; d <= today; d = addDays(d, 1)) {
        if (isDueOnDate(med, d, timeZone) && tookOn(d)) meds += Math.round(worth)
      }
    } else {
      for (let week = weekStartOf(start); week <= currentWeek; week = addDays(week, 7)) {
        let due = 0
        let done = 0
        let future = false
        for (let i = 0; i < 7; i++) {
          const d = addDays(week, i)
          if (d < start || !isDueOnDate(med, d, timeZone)) continue
          if (d > today) {
            future = true
            continue
          }
          due++
          if (tookOn(d)) done++
        }
        if (due > 0 && !future && done === due) meds += POINTS.medWeek
      }
    }

    // progresso da semana atual (pra tela e pra missão)
    let due = 0
    let done = 0
    for (let i = 0; i < 7; i++) {
      const d = addDays(currentWeek, i)
      if (d < start || d > today || !isDueOnDate(med, d, timeZone)) continue
      due++
      if (tookOn(d)) done++
    }
    if (due > 0) medWeek.push({ medicationId: med.id, name: med.name, doneDays: done, dueDays: due })
  }

  // --- treinos: meta semanal ---
  const sessionsByWeek = new Map<string, number>()
  for (const l of input.workoutLogs) {
    if (!onTime(l.date, l.createdAt)) continue
    const w = weekStartOf(l.date)
    sessionsByWeek.set(w, (sessionsByWeek.get(w) ?? 0) + 1)
  }
  let workouts = 0
  let workoutGoalWeeks = 0
  if (input.workoutGoal > 0) {
    for (const n of sessionsByWeek.values()) {
      if (n >= input.workoutGoal) {
        workouts += POINTS.workoutWeek
        workoutGoalWeeks++
      }
    }
  }

  // --- social: teto por dia ---
  const socialByDay = new Map<string, number>()
  let socialWeekActions = 0
  for (const s of input.social) {
    const date = dateStrInTimezone(s.createdAt, timeZone)
    if (date < since) continue
    socialByDay.set(date, (socialByDay.get(date) ?? 0) + POINTS[s.kind])
    if (date >= currentWeek) socialWeekActions++
  }
  let social = 0
  for (const pts of socialByDay.values()) social += Math.min(pts, POINTS.socialDailyCap)

  const breakdown: PointsBreakdown = { dayLog, routines, routineBets, meds, workouts, social }
  return {
    breakdown,
    activity: dayLog + routines + routineBets + meds + workouts + social,
    workoutGoalWeeks,
    week: {
      weekStart: currentWeek,
      dayLogDays: dayLogWeekDays,
      dayLogPoints: dayLogWeekPoints,
      routineDays: routineWeekDays,
      routinePoints: routineWeekPoints,
      betActive,
      betOnTrack,
      meds: medWeek,
      medsAllOnTrack: medWeek.length > 0 && medWeek.every((m) => m.doneDays === m.dueDays),
      workoutsDone: sessionsByWeek.get(currentWeek) ?? 0,
      workoutGoal: input.workoutGoal,
      socialToday: Math.min(socialByDay.get(today) ?? 0, POINTS.socialDailyCap),
      socialWeekActions,
    },
  }
}

/** Dias seguidos (terminando hoje, ou ontem se hoje ainda não entrou) num conjunto de datas. */
export function streakEndingAt(dates: Set<string>, today: string): number {
  let d = dates.has(today) ? today : addDays(today, -1)
  let n = 0
  while (dates.has(d)) {
    n++
    d = addDays(d, -1)
  }
  return n
}

