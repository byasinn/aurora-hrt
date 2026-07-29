import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { LabResult, LabResultInput } from '../../shared/types'

export function useLabResults(type?: string) {
  return useQuery({
    queryKey: ['labs', type ?? 'all'],
    queryFn: () => api.get<LabResult[]>(`/labs${type ? `?type=${type}` : ''}`),
  })
}

export function useCreateLabResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: LabResultInput) => api.post<LabResult>('/labs', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labs'] }),
  })
}

export function useDeleteLabResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/labs?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labs'] }),
  })
}
