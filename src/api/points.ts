import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { ChestView, MissionDefInput, MissionState, StreakDay } from '../../shared/missions'
import type { PeriodCounts, PerfectWeekRoutine, PointsBreakdown, RoutineMode, WeekProgress } from '../../shared/points'

export interface PointsSummary {
  total: number
  legacy: number
  transitionBonus: number
  visits: number
  chests: number
  since: string
  visitStreak: number
  potions: number
  unopenedChests: number
  restDaysLeft: number
  breakdown: PointsBreakdown
  activity: number
  week: WeekProgress
  today: PeriodCounts
  lastWeekDaily: PerfectWeekRoutine[]
  workoutGoalWeeks: number
}

export interface VisitResult {
  isNew: boolean
  streak: number
  points: number
  chest: boolean
  brokenStreak?: number
  potions?: number
  usedRestDay?: boolean
  gotRestDay?: boolean
  restDaysLeft?: number
}

export interface MissionsState {
  missions: MissionState[]
  dailyUnlocked: boolean
  chests: ChestView[]
  potions: number
  streak: number
  restDaysLeft: number
  streakWeek: StreakDay[]
  rescued: string[]
  today: string
}

export interface PendingDoseGroup {
  medicationId: number
  name: string
  doseAmount: string
  doseUnit: string
  instances: { scheduledFor: string; date: string }[]
}

export interface CheckinState {
  today: string
  review: {
    date: string
    routines: { id: number; name: string; icon: string }[]
    workouts: { dayId: number; name: string; programName: string }[]
  } | null
  doses: PendingDoseGroup[]
  potions: number
}

/** Tudo que mexe em Brilho (registrar dia, rotina, dose, treino, curtir…) invalida isso — ver queryClient. */
export function usePoints() {
  return useQuery({ queryKey: ['points'], queryFn: () => api.get<PointsSummary>('/points') })
}

export function useMissions() {
  return useQuery({ queryKey: ['missions'], queryFn: () => api.get<MissionsState>('/missions') })
}

function useRewardsInvalidate() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['points'] })
    qc.invalidateQueries({ queryKey: ['missions'] })
    qc.invalidateQueries({ queryKey: ['shop'] })
  }
}

export function useVisit() {
  const invalidate = useRewardsInvalidate()
  return useMutation({ mutationFn: () => api.post<VisitResult>('/visit', {}), onSuccess: invalidate })
}

export function useClaimMission() {
  const invalidate = useRewardsInvalidate()
  return useMutation({ mutationFn: (key: string) => api.post<ChestView>('/missions/claim', { key }), onSuccess: invalidate })
}

export function useOpenChest() {
  const invalidate = useRewardsInvalidate()
  return useMutation({ mutationFn: (id: number) => api.post<ChestView>(`/chests/${id}/open`, {}), onSuccess: invalidate })
}

export function useUsePotion() {
  const invalidate = useRewardsInvalidate()
  return useMutation({
    mutationFn: (date: string) => api.post<{ ok: true; potions: number; streak: number }>('/potions/use', { date }),
    onSuccess: invalidate,
  })
}

export function useCheckin(enabled = true) {
  return useQuery({ queryKey: ['checkin'], queryFn: () => api.get<CheckinState>('/checkin'), enabled, staleTime: 5 * 60_000 })
}

export function useSubmitReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { date: string; routineIds: number[]; workoutDayIds: number[] }) => api.post('/checkin/review', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checkin'] })
      qc.invalidateQueries({ queryKey: ['routine-logs'] })
      qc.invalidateQueries({ queryKey: ['workout-logs'] })
    },
  })
}

export function useSubmitMissedDoses() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entries: { medicationId: number; scheduledFor: string; taken: boolean }[]) => api.post('/checkin/doses', { entries }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checkin'] })
      qc.invalidateQueries({ queryKey: ['dose-logs'] })
      qc.invalidateQueries({ queryKey: ['today'] })
    },
  })
}

export interface ChallengeState {
  introSeen: boolean
  almost: (PerfectWeekRoutine & { canStartNow: boolean })[]
}

export function useChallenge(enabled = true) {
  return useQuery({ queryKey: ['challenge'], queryFn: () => api.get<ChallengeState>('/challenge'), enabled, staleTime: 10 * 60_000 })
}

export function useChallengeSeen() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (kind: 'intro' | 'almost') => api.post('/challenge/seen', { kind }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challenge'] }),
  })
}

export function useSetRoutineMode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { routineIds: number[] | 'all'; mode: RoutineMode; when: 'now' | 'next' }) =>
      api.post<{ routineId: number; from: string }[]>('/routine-mode', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routines'] })
      qc.invalidateQueries({ queryKey: ['challenge'] })
    },
  })
}

// ---------- admin: missões ----------

export type MissionRow = MissionDefInput & { id: number; createdAt: string }

export function useAdminMissions() {
  return useQuery({ queryKey: ['admin', 'missions'], queryFn: () => api.get<MissionRow[]>('/admin/missions') })
}

export function useSaveMission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: MissionDefInput & { id?: number }) =>
      id ? api.put<MissionRow>(`/admin/missions/${id}`, body) : api.post<MissionRow>('/admin/missions', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'missions'] }),
  })
}

export function useDeleteMission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/missions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'missions'] }),
  })
}
