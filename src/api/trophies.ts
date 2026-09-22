import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { UnlockedTrophy } from '../../shared/types'

export function useUnlockedTrophies() {
  return useQuery({
    queryKey: ['unlocked-trophies'],
    queryFn: () => api.get<UnlockedTrophy[]>('/unlocked-trophies'),
  })
}

export function useUnlockTrophy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => api.post<UnlockedTrophy>('/unlocked-trophies', { key }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unlocked-trophies'] }),
  })
}
