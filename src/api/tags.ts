import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { Tag, TagInput, TagType } from '../../shared/types'

export function useTags(type?: TagType) {
  return useQuery({
    queryKey: ['tags', type ?? 'all'],
    queryFn: () => api.get<Tag[]>(`/tags${type ? `?type=${type}` : ''}`),
  })
}

export function useCreateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TagInput) => api.post<Tag>('/tags', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })
}

export function useDeleteTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/tags?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })
}
