import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { UnlockedAchievement } from '../../shared/types'

export function useUnlockedAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: () => api.get<UnlockedAchievement[]>('/achievements'),
  })
}

export function useUnlockAchievement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => api.post<UnlockedAchievement>('/achievements', { key }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['achievements'] }),
  })
}
