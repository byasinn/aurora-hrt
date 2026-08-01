import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type {
  CommunityDetail,
  CommunityFeedPost,
  CommunityPostCommentWithAuthor,
  CommunityPostInput,
} from '../../shared/types'

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
      qc.invalidateQueries({ queryKey: ['community-feed'] })
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
      qc.invalidateQueries({ queryKey: ['community-feed'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useCommunityFeed(enabled: boolean) {
  return useQuery({
    queryKey: ['community-feed'],
    queryFn: () => api.get<CommunityFeedPost[]>('/community-posts'),
    enabled,
  })
}

export function useCreateCommunityPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CommunityPostInput) => api.post<CommunityFeedPost>('/community-posts', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-feed'] }),
  })
}

export function useDeleteCommunityPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/community-posts?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-feed'] }),
  })
}

export function useLikeCommunityPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => api.post('/community-post-likes', { postId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-feed'] }),
  })
}

export function useUnlikeCommunityPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => api.delete(`/community-post-likes?postId=${postId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-feed'] }),
  })
}

export function useCommunityPostComments(postId: number | null) {
  return useQuery({
    queryKey: ['community-post-comments', postId],
    queryFn: () => api.get<CommunityPostCommentWithAuthor[]>(`/community-post-comments?postId=${postId}`),
    enabled: postId != null,
  })
}

export function useCreateCommunityPostComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { postId: number; text: string }) =>
      api.post<CommunityPostCommentWithAuthor>('/community-post-comments', input),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ['community-post-comments', input.postId] })
      qc.invalidateQueries({ queryKey: ['community-feed'] })
    },
  })
}

export function useDeleteCommunityPostComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/community-post-comments?id=${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-post-comments'] })
      qc.invalidateQueries({ queryKey: ['community-feed'] })
    },
  })
}
