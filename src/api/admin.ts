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

export function useSetUserAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isAdmin }: { id: number; isAdmin: boolean }) =>
      api.put<AdminUserSummary>(`/admin-users?id=${id}`, { isAdmin }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}

export function useSetUserVerified() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isVerified }: { id: number; isVerified: boolean }) =>
      api.put<AdminUserSummary>(`/admin-users?id=${id}`, { isVerified }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin-users?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}
