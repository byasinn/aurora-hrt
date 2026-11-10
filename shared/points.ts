import { dateStrInTimezone, isDueOnDate, type SchedulableMedication } from './scheduling'

// Brilho v2 — regras de pontos num lugar só (o Worker calcula com isso; a tela de Brilho explica com
// as mesmas constantes). Ideia geral:
// - vale o que é marcado NO DIA. Marcou depois (o "e ontem, fez?", doses de dias atrás) fica no
//   histórico mas não dá Brilho — a não ser que a pessoa use uma Poção do tempo naquele dia.
// - remédio e treino pagam por semana completa, não por dose/sessão.
// - rotina paga pouco por dia, ou (Semana Perfeita, escolhida por rotina) +50% no fim da semana só
//   se foi feita em todos os dias.
// - social tem teto diário, e criar/apagar coisa não dá ponto nenhum.

export const POINTS = {
  dayLog: { mood: 2, energy: 1, libido: 1, symptoms: 1, notes: 2 },
  routinePerDay: 2,
  routinesCountedPerDay: 5, // no máximo 5 rotinas por dia contam (10 Brilho/dia)
  perfectWeekMultiplier: 1.5,
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
/** Streak: a cada 7 dias seguidos o app guarda 1 dia de folga (até 2) que cobre um dia sem abrir. */
export const REST_DAY_EVERY = 7
export const MAX_REST_DAYS = 2

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

// ---------- modo da rotina: todo dia ou Semana Perfeita ----------

export type RoutineMode = 'daily' | 'weekly'
/** Mudanças de modo com a semana (segunda) em que passam a valer — a última com from ≤ semana manda. */
export type RoutineModeHistory = { from: string; mode: RoutineMode }[]

export function routineModeFor(history: unknown, weekStart: string): RoutineMode {
  let mode: RoutineMode = 'daily'
  let at = ''
  for (const h of (history as RoutineModeHistory | null) ?? []) {
    if (h.from <= weekStart && h.from >= at) {
      mode = h.mode
      at = h.from
    }
  }
  return mode
}

/** Grava a mudança de modo a partir de `from` (substitui o que já estava marcado pra essa semana ou depois). */
export function withRoutineMode(history: unknown, from: string, mode: RoutineMode): RoutineModeHistory {
  const kept = ((history as RoutineModeHistory | null) ?? []).filter((h) => h.from < from)
  return [...kept, { from, mode }]
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
  routines: { id: number; name: string; type: string; targetCount: number | null; daysOfWeek: unknown; createdAt: Date; modeHistory: unknown }[]
  routineLogs: { routineId: number; date: string; count: number; createdAt: Date }[]
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
  routinePerfectWeeks: number
  meds: number
  workouts: number
  social: number
}

/** Contagens de um período (hoje ou essa semana) — é o que as missões diárias/semanais medem. */
export interface PeriodCounts {
  dayLogDays: number
  routineDays: number
  routinesDone: number
  medsDue: number
  medsOnTime: boolean
  workouts: number
  likes: number
  comments: number
  posts: number
}

export interface PerfectWeekRoutine {
  routineId: number
  name: string
  done: number
  due: number
  onTrack: boolean
}

export interface WeekProgress extends PeriodCounts {
  weekStart: string
  dayLogPoints: number
  routinePoints: number
  /** rotinas em Semana Perfeita nessa semana e se ainda estão perfeitas até hoje */
  perfectWeek: PerfectWeekRoutine[]
  meds: MedWeekProgress[]
  workoutGoal: number
  socialToday: number
}

export interface PointsResult {
  breakdown: PointsBreakdown
  activity: number
  week: WeekProgress
  today: PeriodCounts
  /** semana passada, rotinas no modo todo dia: quantos dias fez de quantos previstos (pro convite da Semana Perfeita) */
  lastWeekDaily: PerfectWeekRoutine[]
  workoutGoalWeeks: number
}

export function computeActivityPoints(input: PointsInput): PointsResult {
  const { today, since, timeZone, rescued } = input
  const onTime = (date: string, createdAt: Date) => date >= since && date <= today && (!isLate(date, createdAt, timeZone) || rescued.has(date))
  const currentWeek = weekStartOf(today)
  const inWeek = (d: string) => d >= currentWeek && d <= today

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
    if (inWeek(date) && pts > 0) {
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
    const [id, date] = [Number(key.slice(0, key.indexOf(':'))), key.slice(key.indexOf(':') + 1)]
    if (routineModeFor(routineById.get(id)?.modeHistory, weekStartOf(date)) === 'weekly') continue // paga no fim da semana
    routinesPerDay.set(date, (routinesPerDay.get(date) ?? 0) + 1)
  }
  let routines = 0
  let routineWeekPoints = 0
  for (const [date, n] of routinesPerDay) {
    const pts = Math.min(n, POINTS.routinesCountedPerDay) * POINTS.routinePerDay
    routines += pts
    if (inWeek(date)) routineWeekPoints += pts
  }
  const doneDates = [...doneOnTime].map((k) => k.slice(k.indexOf(':') + 1))
  const routineWeekDays = new Set(doneDates.filter(inWeek)).size
  const routinesDoneToday = doneDates.filter((d) => d === today).length

  // Semana Perfeita: cada rotina vale sozinha — fez em todos os dias previstos da semana, ganha 1,5x
  function evaluateWeek(r: PointsInput['routines'][number], weekStart: string, until: string): PerfectWeekRoutine | null {
    const created = dateStrInTimezone(r.createdAt, timeZone)
    let due = 0
    let done = 0
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i)
      if (d > until || d < since || d < created || !routineDueOn(r, d)) continue
      due++
      if (doneOnTime.has(`${r.id}:${d}`)) done++
    }
    return due > 0 ? { routineId: r.id, name: r.name, done, due, onTrack: done === due } : null
  }
  let routinePerfectWeeks = 0
  for (let week = weekStartOf(since); week < currentWeek; week = addDays(week, 7)) {
    const paid = input.routines
      .filter((r) => routineModeFor(r.modeHistory, week) === 'weekly')
      .map((r) => evaluateWeek(r, week, addDays(week, 6)))
      .filter((e): e is PerfectWeekRoutine => !!e && e.onTrack)
      .map((e) => Math.round(e.due * POINTS.routinePerDay * POINTS.perfectWeekMultiplier))
      .sort((a, b) => b - a)
      .slice(0, POINTS.routinesCountedPerDay)
    routinePerfectWeeks += paid.reduce((s, p) => s + p, 0)
  }
  // semana atual: até ontem tem que estar perfeito; hoje ainda dá tempo
  const perfectWeek = input.routines
    .filter((r) => routineModeFor(r.modeHistory, currentWeek) === 'weekly')
    .map((r) => {
      const e = evaluateWeek(r, currentWeek, today)
      if (!e) return null
      const pendingToday = routineDueOn(r, today) && !doneOnTime.has(`${r.id}:${today}`) ? 1 : 0
      return { ...e, onTrack: e.done >= e.due - pendingToday }
    })
    .filter((e): e is PerfectWeekRoutine => !!e)
  const lastWeek = addDays(currentWeek, -7)
  const lastWeekDaily = input.routines
    .filter((r) => routineModeFor(r.modeHistory, lastWeek) === 'daily')
    .map((r) => evaluateWeek(r, lastWeek, addDays(lastWeek, 6)))
    .filter((e): e is PerfectWeekRoutine => !!e)

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
  let medsDueToday = 0
  let medsTakenToday = 0
  for (const med of input.meds) {
    const created = dateStrInTimezone(med.createdAt, timeZone)
    const start = since > created ? since : created
    const perDay = Math.max(1, med.preferredTimes?.length ?? 1)
    if (med.active !== false && created <= today && isDueOnDate(med, today, timeZone)) {
      medsDueToday++
      if ((takenByMedDay.get(`${med.id}:${today}`) ?? 0) >= perDay) medsTakenToday++
    }
    if (start > today) continue
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
  let workoutsToday = 0
  for (const l of input.workoutLogs) {
    if (!onTime(l.date, l.createdAt)) continue
    const w = weekStartOf(l.date)
    sessionsByWeek.set(w, (sessionsByWeek.get(w) ?? 0) + 1)
    if (l.date === today) workoutsToday++
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
  const socialWeek = { like: 0, comment: 0, post: 0 }
  const socialToday = { like: 0, comment: 0, post: 0 }
  for (const s of input.social) {
    const date = dateStrInTimezone(s.createdAt, timeZone)
    if (date < since) continue
    socialByDay.set(date, (socialByDay.get(date) ?? 0) + POINTS[s.kind])
    if (inWeek(date)) socialWeek[s.kind]++
    if (date === today) socialToday[s.kind]++
  }
  let social = 0
  for (const pts of socialByDay.values()) social += Math.min(pts, POINTS.socialDailyCap)

  const breakdown: PointsBreakdown = { dayLog, routines, routinePerfectWeeks, meds, workouts, social }
  return {
    breakdown,
    activity: dayLog + routines + routinePerfectWeeks + meds + workouts + social,
    workoutGoalWeeks,
    lastWeekDaily,
    today: {
      dayLogDays: (dayLogByDate.get(today) ?? 0) > 0 ? 1 : 0,
      routineDays: routinesDoneToday > 0 ? 1 : 0,
      routinesDone: routinesDoneToday,
      medsDue: medsDueToday,
      medsOnTime: medsDueToday > 0 && medsTakenToday === medsDueToday,
      workouts: workoutsToday,
      likes: socialToday.like,
      comments: socialToday.comment,
      posts: socialToday.post,
    },
    week: {
      weekStart: currentWeek,
      dayLogDays: dayLogWeekDays,
      dayLogPoints: dayLogWeekPoints,
      routineDays: routineWeekDays,
      routinesDone: doneDates.filter(inWeek).length,
      routinePoints: routineWeekPoints,
      perfectWeek,
      meds: medWeek,
      medsDue: medWeek.length,
      medsOnTime: medWeek.length > 0 && medWeek.every((m) => m.doneDays === m.dueDays),
      workouts: sessionsByWeek.get(currentWeek) ?? 0,
      workoutGoal: input.workoutGoal,
      likes: socialWeek.like,
      comments: socialWeek.comment,
      posts: socialWeek.post,
      socialToday: Math.min(socialByDay.get(today) ?? 0, POINTS.socialDailyCap),
    },
  }
}

// ---------- streak de abrir o app (com dias de folga) ----------

export type StreakDayStatus = 'fire' | 'rest' | 'missed' | 'pending' | 'none'

export interface StreakState {
  streak: number
  restDaysLeft: number
  /** status de cada dia desde a primeira visita */
  days: Map<string, StreakDayStatus>
}

/**
 * Anda dia a dia desde a primeira visita: abriu (ou salvou com poção) = fogo; não abriu = gasta uma
 * folga se tiver (💤, o streak continua sem somar) ou quebra. A cada 7 dias de streak ganha uma folga.
 * Hoje sem abrir ainda não é perdido.
 */
export function computeStreak(visited: Set<string>, today: string): StreakState {
  const days = new Map<string, StreakDayStatus>()
  const sorted = [...visited].filter((d) => d <= today).sort()
  let streak = 0
  let rest = 0
  if (sorted.length === 0) return { streak: 0, restDaysLeft: 0, days }
  for (let d = sorted[0]; d <= today; d = addDays(d, 1)) {
    if (visited.has(d)) {
      streak++
      if (streak % REST_DAY_EVERY === 0) rest = Math.min(MAX_REST_DAYS, rest + 1)
      days.set(d, 'fire')
    } else if (d === today) {
      days.set(d, 'pending')
    } else if (streak > 0 && rest > 0) {
      rest--
      days.set(d, 'rest')
    } else {
      streak = 0
      rest = 0
      days.set(d, 'missed')
    }
  }
  return { streak, restDaysLeft: rest, days }
}
