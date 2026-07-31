import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { Post, PostInput } from '../../shared/types'

export function usePosts(enabled = true) {
  return useQuery({
    queryKey: ['posts'],
    queryFn: () => api.get<Post[]>('/posts'),
    enabled,
  })
}

export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PostInput) => api.post<Post>('/posts', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/posts?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })
}
