import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type {
  Follow,
  FeedPost,
  MySocialStats,
  PostCommentInput,
  PostCommentWithAuthor,
  PublicUserSummary,
  UserProfileDetail,
} from '../../shared/types'

export function useMySocialStats() {
  return useQuery({
    queryKey: ['my-social-stats'],
    queryFn: () => api.get<MySocialStats>('/my-social-stats'),
  })
}

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ['users-search', query],
    queryFn: () => api.get<PublicUserSummary[]>(`/users-search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length > 0,
  })
}

export function useUserProfile(userId: number | null) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => api.get<UserProfileDetail>(`/users-profile?userId=${userId}`),
    enabled: userId != null,
  })
}

export function useMyFollowing() {
  return useQuery({
    queryKey: ['follows'],
    queryFn: () => api.get<Follow[]>('/follows'),
  })
}

function invalidateFollowRelated(qc: ReturnType<typeof useQueryClient>, userId: number) {
  qc.invalidateQueries({ queryKey: ['follows'] })
  qc.invalidateQueries({ queryKey: ['user-profile', userId] })
  qc.invalidateQueries({ queryKey: ['users-search'] })
  qc.invalidateQueries({ queryKey: ['feed'] })
}

export function useFollow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (followingId: number) => api.post('/follows', { followingId }),
    onSuccess: (_data, followingId) => invalidateFollowRelated(qc, followingId),
  })
}

export function useUnfollow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (followingId: number) => api.delete(`/follows?followingId=${followingId}`),
    onSuccess: (_data, followingId) => invalidateFollowRelated(qc, followingId),
  })
}

export function useFeed() {
  return useQuery({
    queryKey: ['feed'],
    queryFn: () => api.get<FeedPost[]>('/feed'),
  })
}

export function useLikePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => api.post('/post-likes', { postId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })
}

export function useUnlikePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => api.delete(`/post-likes?postId=${postId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })
}

export function usePostComments(postId: number | null) {
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: () => api.get<PostCommentWithAuthor[]>(`/post-comments?postId=${postId}`),
    enabled: postId != null,
  })
}

export function useCreateComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PostCommentInput) => api.post<PostCommentWithAuthor>('/post-comments', input),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ['post-comments', input.postId] })
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })
}

export function useDeleteComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/post-comments?id=${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['post-comments'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })
}
