import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { ChestView, MissionState } from '../../shared/missions'
import type { PointsBreakdown, WeekProgress } from '../../shared/points'

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
  breakdown: PointsBreakdown
  activity: number
  week: WeekProgress
  workoutGoalWeeks: number
}

export interface VisitResult {
  isNew: boolean
  streak: number
  points: number
  chest: boolean
  brokenStreak?: number
  potions?: number
}

export interface MissionsState {
  missions: MissionState[]
  chests: ChestView[]
  potions: number
  streak: number
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

export interface RoutineBetState {
  current: boolean
  next: boolean
  auto: boolean
  canJoinCurrent?: boolean
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

export function useRoutineBet() {
  return useQuery({ queryKey: ['routine-bet'], queryFn: () => api.get<RoutineBetState>('/routine-bet') })
}

export function useSetRoutineBet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { week: 'current' | 'next'; on: boolean } | { auto: boolean }) => api.post<RoutineBetState>('/routine-bet', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routine-bet'] })
      qc.invalidateQueries({ queryKey: ['points'] })
    },
  })
}
