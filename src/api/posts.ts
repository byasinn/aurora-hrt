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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

/** Repost — cria um post "vazio" apontando pro original, sem duplicar texto/imagens. */
export function useRepost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => api.post<Post>('/posts', { repostOfKind: 'post', repostOfId: postId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/posts?id=${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}
