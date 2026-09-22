import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { DayNote, DayNoteInput } from '../../shared/types'

export function useDayNotes(params: { from?: string; to?: string } = {}) {
  const qs = new URLSearchParams()
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  const query = qs.toString()

  return useQuery({
    queryKey: ['day-notes', params],
    queryFn: () => api.get<DayNote[]>(`/day-notes${query ? `?${query}` : ''}`),
  })
}

export function useSaveDayNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: DayNoteInput) => api.post<DayNote>('/day-notes', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['day-notes'] }),
  })
}

export function useDeleteDayNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/day-notes?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['day-notes'] }),
  })
}
