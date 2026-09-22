import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type {
  CommunityDetail,
  CommunityFeedPost,
  CommunityInput,
  CommunityMemberWithProfile,
  CommunityPostCommentWithAuthor,
  CommunityPostInput,
  CommunitySummary,
} from '../../shared/types'

export function useCommunity(id: number) {
  return useQuery({
    queryKey: ['community', id],
    queryFn: () => api.get<CommunityDetail>(`/communities?id=${id}`),
    enabled: !!id,
  })
}

export function useCommunities(q: string) {
  return useQuery({
    queryKey: ['communities', q],
    queryFn: () => api.get<CommunitySummary[]>(`/communities${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`),
  })
}

export function useCreateCommunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CommunityInput) => api.post<CommunityDetail>('/communities', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communities'] }),
  })
}

export function useJoinCommunity(communityId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/community-members', { communityId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', communityId] })
      qc.invalidateQueries({ queryKey: ['communities'] })
      qc.invalidateQueries({ queryKey: ['community-feed', communityId] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useCommunityMembers(communityId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['community-members', communityId],
    queryFn: () => api.get<CommunityMemberWithProfile[]>(`/community-members?communityId=${communityId}`),
    enabled,
  })
}

export function useLeaveCommunity(communityId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(`/community-members?communityId=${communityId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', communityId] })
      qc.invalidateQueries({ queryKey: ['communities'] })
      qc.invalidateQueries({ queryKey: ['community-feed', communityId] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useCommunityFeed(communityId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['community-feed', communityId],
    queryFn: () => api.get<CommunityFeedPost[]>(`/community-posts?communityId=${communityId}`),
    enabled,
  })
}

export function useCreateCommunityPost(communityId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CommunityPostInput) =>
      api.post<CommunityFeedPost>('/community-posts', { ...input, communityId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-feed', communityId] }),
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
    mutationFn: (input: { postId: number; text: string; parentCommentId?: number | null }) =>
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

export function useLikeCommunityComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => api.post('/community-post-comment-likes', { commentId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-post-comments'] }),
  })
}

export function useUnlikeCommunityComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => api.delete(`/community-post-comment-likes?commentId=${commentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-post-comments'] }),
  })
}
