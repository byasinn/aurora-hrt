import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { IntimateLog, IntimateLogInput } from '../../shared/types'

export function useIntimateLogs(params: { from?: string; to?: string } = {}) {
  const qs = new URLSearchParams()
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  const query = qs.toString()

  return useQuery({
    queryKey: ['intimate-logs', params],
    queryFn: () => api.get<IntimateLog[]>(`/intimate-logs${query ? `?${query}` : ''}`),
  })
}

export function useSaveIntimateLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: IntimateLogInput) => api.post<IntimateLog>('/intimate-logs', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['intimate-logs'] }),
  })
}

export function useDeleteIntimateLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/intimate-logs?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['intimate-logs'] }),
  })
}
