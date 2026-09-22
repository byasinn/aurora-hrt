import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type {
  Follow,
  FeedItem,
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

/** Aceita username OU (por compatibilidade com links antigos) um userId numérico. */
export function useUserProfileByHandle(handle: string | null) {
  const isNumeric = !!handle && /^\d+$/.test(handle)
  return useQuery({
    queryKey: ['user-profile', 'handle', handle],
    queryFn: () =>
      api.get<UserProfileDetail>(
        isNumeric ? `/users-profile?userId=${handle}` : `/users-profile?username=${encodeURIComponent(handle!)}`,
      ),
    enabled: !!handle,
  })
}

export function useMyFollowing() {
  return useQuery({
    queryKey: ['follows'],
    queryFn: () => api.get<Follow[]>('/follows'),
  })
}

export function useConnections(userId: number, type: 'followers' | 'following', q: string) {
  return useQuery({
    queryKey: ['users-connections', userId, type, q],
    queryFn: () =>
      api.get<PublicUserSummary[]>(
        `/users-connections?userId=${userId}&type=${type}${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`,
      ),
  })
}

function invalidateFollowRelated(qc: ReturnType<typeof useQueryClient>, userId: number) {
  qc.invalidateQueries({ queryKey: ['follows'] })
  qc.invalidateQueries({ queryKey: ['user-profile', userId] })
  qc.invalidateQueries({ queryKey: ['users-search'] })
  qc.invalidateQueries({ queryKey: ['feed'] })
  qc.invalidateQueries({ queryKey: ['follow-suggestions'] })
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

export function useRemoveFollower() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (followerId: number) => api.delete(`/follows?removeFollowerId=${followerId}`),
    onSuccess: (_data, followerId) => invalidateFollowRelated(qc, followerId),
  })
}

export function useFollowRequests() {
  return useQuery({
    queryKey: ['follow-requests'],
    queryFn: () => api.get<PublicUserSummary[]>('/follow-requests'),
  })
}

export function useAcceptFollowRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (followerId: number) => api.put(`/follow-requests?followerId=${followerId}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-requests'] })
      qc.invalidateQueries({ queryKey: ['users-connections'] })
    },
  })
}

export function useDeclineFollowRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (followerId: number) => api.delete(`/follow-requests?followerId=${followerId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['follow-requests'] }),
  })
}

export function useFeed() {
  return useQuery({
    queryKey: ['feed'],
    queryFn: () => api.get<FeedItem[]>('/feed'),
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

export function useLikeComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => api.post('/post-comment-likes', { commentId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post-comments'] }),
  })
}

export function useUnlikeComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => api.delete(`/post-comment-likes?commentId=${commentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post-comments'] }),
  })
}
