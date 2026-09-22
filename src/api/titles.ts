import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { TitleTrack, UnlockedTitle } from '../../shared/types'

export function useUnlockedTitles() {
  return useQuery({
    queryKey: ['unlocked-titles'],
    queryFn: () => api.get<UnlockedTitle[]>('/unlocked-titles'),
  })
}

export function useUnlockTitle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { key: string; track: TitleTrack }) => api.post<UnlockedTitle>('/unlocked-titles', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unlocked-titles'] }),
  })
}
