import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { TopicPageWithMeta, TopicPost, TopicPageInput, ContentSource, ContentSourceInput, FollowSuggestion } from '../../shared/types'

export function useTopicPages() {
  return useQuery({
    queryKey: ['topic-pages'],
    queryFn: () => api.get<TopicPageWithMeta[]>('/topic-pages'),
  })
}

export function useTopicPosts(topicPageId: number | null) {
  return useQuery({
    queryKey: ['topic-posts', topicPageId],
    queryFn: () => api.get<TopicPost[]>(`/topic-posts?topicPageId=${topicPageId}`),
    enabled: topicPageId != null,
  })
}

/** Uma notícia só, sorteada (mas estável o dia inteiro) — a página "Notícias" virou só isso depois
 * do feedback de que várias páginas de tópico com post atrás de post ficou ruim de usar. */
export function useDailyTopicPost() {
  return useQuery({
    queryKey: ['topic-posts-daily'],
    queryFn: () => api.get<TopicPost | null>('/topic-posts/daily'),
    staleTime: 60 * 60_000,
  })
}

export function useFollowTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (topicPageId: number) => api.post('/topic-page-follows', { topicPageId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['topic-pages'] })
      qc.invalidateQueries({ queryKey: ['follow-suggestions'] })
    },
  })
}

export function useUnfollowTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (topicPageId: number) => api.delete(`/topic-page-follows?topicPageId=${topicPageId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topic-pages'] }),
  })
}

export function useFollowSuggestions() {
  return useQuery({
    queryKey: ['follow-suggestions'],
    queryFn: () => api.get<FollowSuggestion[]>('/follow-suggestions'),
  })
}

// --- admin ---

export function useCreateTopicPage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TopicPageInput) => api.post<TopicPageWithMeta>('/topic-pages', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topic-pages'] }),
  })
}

export function useContentSources() {
  return useQuery({
    queryKey: ['content-sources'],
    queryFn: () => api.get<ContentSource[]>('/content-sources'),
  })
}

export function useCreateContentSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ContentSourceInput) => api.post<ContentSource>('/content-sources', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-sources'] }),
  })
}

export function useSetContentSourceActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => api.put<ContentSource>(`/content-sources?id=${id}`, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-sources'] }),
  })
}

export function useDeleteContentSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/content-sources?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-sources'] }),
  })
}
