import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { ForumTopicDetail, ForumTopicSummary } from '../../shared/forum'

export function useForumTopics(params: { sort: 'recent' | 'relevant'; tag?: string | null; q?: string }) {
  const qs = new URLSearchParams({ sort: params.sort })
  if (params.tag) qs.set('tag', params.tag)
  if (params.q?.trim()) qs.set('q', params.q.trim())
  return useQuery({
    queryKey: ['forum', 'list', params.sort, params.tag ?? '', params.q?.trim() ?? ''],
    queryFn: () => api.get<ForumTopicSummary[]>(`/forum/topics?${qs}`),
  })
}

export function useForumTopic(id: number) {
  return useQuery({ queryKey: ['forum', 'topic', id], queryFn: () => api.get<ForumTopicDetail>(`/forum/topics/${id}`), enabled: id > 0 })
}

function useForumInvalidate() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['forum'] })
}

export function useCreateTopic() {
  const invalidate = useForumInvalidate()
  return useMutation({
    mutationFn: (body: { title: string; body: string; tags: string[] }) => api.post<{ id: number }>('/forum/topics', body),
    onSuccess: invalidate,
  })
}

export function useUpdateTopic() {
  const invalidate = useForumInvalidate()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; title?: string; body?: string; tags?: string[]; pinned?: boolean; locked?: boolean }) =>
      api.patch(`/forum/topics/${id}`, body),
    onSuccess: invalidate,
  })
}

export function useDeleteTopic() {
  const invalidate = useForumInvalidate()
  return useMutation({ mutationFn: (id: number) => api.delete(`/forum/topics/${id}`), onSuccess: invalidate })
}

export function useReplyTopic() {
  const invalidate = useForumInvalidate()
  return useMutation({
    mutationFn: ({ topicId, body }: { topicId: number; body: string }) => api.post<{ id: number }>(`/forum/topics/${topicId}/replies`, { body }),
    onSuccess: invalidate,
  })
}

export function useDeleteReply() {
  const invalidate = useForumInvalidate()
  return useMutation({ mutationFn: (id: number) => api.delete(`/forum/replies/${id}`), onSuccess: invalidate })
}

export function useLikeTopic() {
  const invalidate = useForumInvalidate()
  return useMutation({ mutationFn: (id: number) => api.post<{ liked: boolean }>(`/forum/topics/${id}/like`, {}), onSuccess: invalidate })
}
