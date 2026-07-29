import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { Medication, MedicationInput } from '../../shared/types'

export function useMedications() {
  return useQuery({
    queryKey: ['medications'],
    queryFn: () => api.get<Medication[]>('/medications'),
  })
}

export function useCreateMedication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MedicationInput & { backfillFrom?: string }) =>
      api.post<Medication>('/medications', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medications'] })
      qc.invalidateQueries({ queryKey: ['today'] })
      qc.invalidateQueries({ queryKey: ['dose-logs'] })
    },
  })
}

export function useUpdateMedication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<MedicationInput> & { id: number }) =>
      api.put<Medication>(`/medications?id=${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medications'] })
      qc.invalidateQueries({ queryKey: ['today'] })
    },
  })
}

export function useDeleteMedication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/medications?id=${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medications'] })
      qc.invalidateQueries({ queryKey: ['today'] })
    },
  })
}
