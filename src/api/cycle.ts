import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { CycleLog, CycleLogInput } from '../../shared/types'

export function useCycleLogs(params: { from?: string; to?: string } = {}) {
  const qs = new URLSearchParams()
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  const query = qs.toString()

  return useQuery({
    queryKey: ['cycle-logs', params],
    queryFn: () => api.get<CycleLog[]>(`/cycle-logs${query ? `?${query}` : ''}`),
  })
}

export function useSaveCycleLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CycleLogInput) => api.post<CycleLog>('/cycle-logs', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cycle-logs'] }),
  })
}

export function useDeleteCycleLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/cycle-logs?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cycle-logs'] }),
  })
}
