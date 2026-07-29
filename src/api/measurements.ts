import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { Measurement, MeasurementInput } from '../../shared/types'

export function useMeasurements(type?: string) {
  return useQuery({
    queryKey: ['measurements', type ?? 'all'],
    queryFn: () => api.get<Measurement[]>(`/measurements${type ? `?type=${type}` : ''}`),
  })
}

export function useCreateMeasurement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MeasurementInput) => api.post<Measurement>('/measurements', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['measurements'] }),
  })
}

export function useDeleteMeasurement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/measurements?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['measurements'] }),
  })
}
