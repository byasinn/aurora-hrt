import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { DirectMessage, DmThread } from '../../shared/types'

export function useConversations() {
  return useQuery({
    queryKey: ['dm-threads'],
    queryFn: () => api.get<DmThread[]>('/dm-threads'),
    refetchInterval: 30_000,
  })
}

export function useConversation(userId: number | null) {
  return useQuery({
    queryKey: ['dm-messages', userId],
    queryFn: () => api.get<DirectMessage[]>(`/dm-messages?userId=${userId}`),
    enabled: userId != null,
    refetchInterval: 15_000,
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { recipientId: number; body: string }) =>
      api.post<DirectMessage>('/dm-messages', input),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ['dm-messages', input.recipientId] })
      qc.invalidateQueries({ queryKey: ['dm-threads'] })
    },
  })
}
