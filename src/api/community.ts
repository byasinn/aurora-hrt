import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { CommunityDetail, CommunityMessageWithAuthor } from '../../shared/types'

export function useCommunity() {
  return useQuery({
    queryKey: ['community'],
    queryFn: () => api.get<CommunityDetail>('/communities'),
  })
}

export function useJoinCommunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/community-members', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useLeaveCommunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/community-members'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useCommunityMessages(enabled: boolean) {
  return useQuery({
    queryKey: ['community-messages'],
    queryFn: () => api.get<CommunityMessageWithAuthor[]>('/community-messages'),
    enabled,
    refetchInterval: 15_000,
  })
}

export function useSendCommunityMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => api.post<CommunityMessageWithAuthor>('/community-messages', { body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-messages'] }),
  })
}
