import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { AdminUserSummary } from '../../shared/types'

export function useAdminUsers(enabled: boolean) {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<AdminUserSummary[]>('/admin-users'),
    enabled,
  })
}

export function useSetUserBanned() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, banned }: { id: number; banned: boolean }) =>
      api.put<AdminUserSummary>(`/admin-users?id=${id}`, { banned }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}
