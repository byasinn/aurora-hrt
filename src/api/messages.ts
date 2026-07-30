import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { Message, MessageInput } from '../../shared/types'

export function useMessages() {
  return useQuery({
    queryKey: ['messages'],
    queryFn: () => api.get<Message[]>('/messages'),
    refetchInterval: 60_000,
  })
}

export function useCreateMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MessageInput) => api.post<Message>('/messages', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
  })
}

export function useMarkMessageRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.put<Message>(`/messages?id=${id}`, { read: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
  })
}

export function useDeleteMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/messages?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
  })
}
