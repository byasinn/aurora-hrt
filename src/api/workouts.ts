import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { WorkoutLog, WorkoutProgramDetail, WorkoutProgramInput, WorkoutSessionInput } from '../../shared/types'

export function useWorkoutPrograms() {
  return useQuery({
    queryKey: ['workout-programs'],
    queryFn: () => api.get<WorkoutProgramDetail[]>('/workout-programs'),
  })
}

export function useCreateWorkoutProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: WorkoutProgramInput) => api.post<WorkoutProgramDetail>('/workout-programs', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-programs'] }),
  })
}

export function useUpdateWorkoutProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<WorkoutProgramInput> & { id: number }) =>
      api.put<WorkoutProgramDetail>(`/workout-programs?id=${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-programs'] }),
  })
}

export function useDeleteWorkoutProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/workout-programs?id=${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workout-programs'] })
      qc.invalidateQueries({ queryKey: ['workout-logs'] })
    },
  })
}

export function useWorkoutLogs(params: { from?: string; to?: string } = {}) {
  const qs = new URLSearchParams()
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  const query = qs.toString()

  return useQuery({
    queryKey: ['workout-logs', params],
    queryFn: () => api.get<WorkoutLog[]>(`/workout-logs${query ? `?${query}` : ''}`),
  })
}

export function useLogWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: WorkoutSessionInput) => api.post<WorkoutLog>('/workout-logs', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-logs'] }),
  })
}

export function useUnlogWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ workoutDayId, date }: { workoutDayId: number; date: string }) =>
      api.delete(`/workout-logs?workoutDayId=${workoutDayId}&date=${date}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-logs'] }),
  })
}
