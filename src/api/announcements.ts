import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { AppAnnouncement, AppAnnouncementInput } from '../../shared/types'

export function useLatestAnnouncement(enabled: boolean) {
  return useQuery({
    queryKey: ['announcements', 'latest'],
    queryFn: () => api.get<AppAnnouncement | null>('/announcements'),
    enabled,
    staleTime: 5 * 60_000,
  })
}

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AppAnnouncementInput) => api.post<AppAnnouncement>('/announcements', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  })
}
