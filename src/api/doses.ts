import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { DoseLog, DoseLogInput, DoseStatus } from '../../shared/types'

export interface TodayItem {
  medication: {
    id: number
    name: string
    doseAmount: string
    doseUnit: string
    route: string
  }
  scheduledFor: string
  doseLogId: number | null
  status: DoseStatus
}

export interface TodayResponse {
  date: string
  timeZone: string
  items: TodayItem[]
}

export function useToday(date?: string) {
  return useQuery({
    queryKey: ['today', date ?? 'current'],
    queryFn: () => api.get<TodayResponse>(`/today${date ? `?date=${date}` : ''}`),
    refetchInterval: 60_000,
  })
}

export function useDoseLogs(params: { from?: string; to?: string; medicationId?: number } = {}) {
  const qs = new URLSearchParams()
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  if (params.medicationId) qs.set('medicationId', String(params.medicationId))
  const query = qs.toString()

  return useQuery({
    queryKey: ['dose-logs', params],
    queryFn: () => api.get<DoseLog[]>(`/doses${query ? `?${query}` : ''}`),
  })
}

export function useLogDose() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: DoseLogInput) => api.post<DoseLog>('/doses', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today'] })
      qc.invalidateQueries({ queryKey: ['dose-logs'] })
    },
  })
}

export function useUpdateDoseLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<DoseLogInput> & { id: number }) =>
      api.put<DoseLog>(`/doses?id=${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today'] })
      qc.invalidateQueries({ queryKey: ['dose-logs'] })
    },
  })
}
