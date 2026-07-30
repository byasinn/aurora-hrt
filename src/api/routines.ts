import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { Routine, RoutineInput, RoutineLog, RoutineLogInput } from '../../shared/types'

export function useRoutines() {
  return useQuery({
    queryKey: ['routines'],
    queryFn: () => api.get<Routine[]>('/routines'),
  })
}

export function useCreateRoutine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RoutineInput) => api.post<Routine>('/routines', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  })
}

export function useUpdateRoutine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<RoutineInput> & { id: number }) =>
      api.put<Routine>(`/routines?id=${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  })
}

export function useDeleteRoutine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/routines?id=${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routines'] })
      qc.invalidateQueries({ queryKey: ['routine-logs'] })
    },
  })
}

export function useRoutineLogs(params: { from?: string; to?: string } = {}) {
  const qs = new URLSearchParams()
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  const query = qs.toString()

  return useQuery({
    queryKey: ['routine-logs', params],
    queryFn: () => api.get<RoutineLog[]>(`/routine-logs${query ? `?${query}` : ''}`),
  })
}

export function useCreateRoutineLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RoutineLogInput) => api.post<RoutineLog>('/routine-logs', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routine-logs'] }),
  })
}

export function useUpdateRoutineLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<RoutineLogInput> & { id: number }) =>
      api.put<RoutineLog>(`/routine-logs?id=${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routine-logs'] }),
  })
}
