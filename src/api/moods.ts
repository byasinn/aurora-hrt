import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { MoodEntry, MoodEntryInput } from '../../shared/types'

export function useMoodEntries(params: { from?: string; to?: string } = {}) {
  const qs = new URLSearchParams()
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  const query = qs.toString()

  return useQuery({
    queryKey: ['mood-entries', params],
    queryFn: () => api.get<MoodEntry[]>(`/moods${query ? `?${query}` : ''}`),
  })
}

export function useCreateMoodEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MoodEntryInput) => api.post<MoodEntry>('/moods', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mood-entries'] }),
  })
}

export function useUpdateMoodEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<MoodEntryInput> & { id: number }) =>
      api.put<MoodEntry>(`/moods?id=${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mood-entries'] }),
  })
}
