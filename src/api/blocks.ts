import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { BlockedUserSummary } from '../../shared/types'

export function useBlockedUsers() {
  return useQuery({
    queryKey: ['blocks'],
    queryFn: () => api.get<BlockedUserSummary[]>('/blocks'),
  })
}

export function useBlockUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => api.post('/blocks', { userId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocks'] })
      qc.invalidateQueries({ queryKey: ['follows'] })
      qc.invalidateQueries({ queryKey: ['user-profile'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useUnblockUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => api.delete(`/blocks?userId=${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blocks'] }),
  })
}
