import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'

// Painel de administração (/admin) — rotas em worker/routes/admin-panel.ts

export interface AdminStats {
  totalUsers: number
  newUsers: { day: number; week: number; month: number }
  bannedUsers: number
  posts: { day: number; week: number }
  pendingReports: number
  pendingQuarantine: number
  activeToday: number
  loginsWeek: number
  signupsByDay: { day: string; value: number }[]
}

export interface AdminUserRow {
  id: number
  email: string
  emailVerified: boolean
  isAdmin: boolean
  banned: boolean
  createdAt: string
  isVerified: boolean
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  avatarIcon: string | null
}

export interface AdminUserDetail {
  user: {
    id: number
    email: string
    emailVerified: boolean
    isAdmin: boolean
    banned: boolean
    banReason: string | null
    bannedAt: string | null
    hasPassword: boolean
    hasGoogle: boolean
    createdAt: string
    lastLoginAt: string | null
  }
  profile: {
    username: string | null
    displayName: string
    pronouns: string
    gender: string | null
    bio: string | null
    avatarUrl: string | null
    avatarIcon: string | null
    isVerified: boolean
    isPrivate: boolean
    transitionStartDate: string | null
    country: string | null
    city: string | null
  } | null
  postsCount: number
  recentPosts: { id: number; text: string | null; images: string[]; createdAt: string }[]
  reportsAgainst: { id: number; reason: string | null; status: string; createdAt: string }[]
  notes: { id: number; body: string; createdAt: string; authorEmail: string | null }[]
  quarantine: { id: number; status: string; reason: string; createdAt: string }[]
}

export interface QuarantineItem {
  id: number
  userId: number | null
  reason: string
  scores: Record<string, unknown>
  status: 'pending' | 'approved' | 'deleted'
  createdAt: string
  reviewedAt: string | null
  email: string | null
  username: string | null
  displayName: string | null
}

export interface AdminContentItem {
  id: number
  kind: 'post' | 'community'
  userId: number | null
  text: string | null
  images: string[]
  createdAt: string
  communityId: number | null
  author: { username: string | null; displayName: string } | null
}

export function useAdminStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api.get<AdminStats>('/admin/stats'), refetchInterval: 60_000 })
}

export function useAdminUserList(params: { q: string; filter: string; page: number }) {
  const search = new URLSearchParams({ q: params.q, filter: params.filter, page: String(params.page) })
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => api.get<{ items: AdminUserRow[]; total: number; page: number; pageSize: number }>(`/admin/users?${search}`),
    placeholderData: keepPreviousData,
  })
}

export function useAdminUser(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => api.get<AdminUserDetail>(`/admin/users/${id}`),
    enabled: id != null,
  })
}

function useInvalidateAdmin() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['admin'] })
    qc.invalidateQueries({ queryKey: ['admin-users'] })
  }
}

export function useAddAdminNote() {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: ({ userId, body }: { userId: number; body: string }) => api.post(`/admin/users/${userId}/notes`, { body }),
    onSuccess: invalidate,
  })
}

export function useBanUser() {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: ({ userId, banned, reason }: { userId: number; banned: boolean; reason?: string }) =>
      api.post(`/admin/users/${userId}/ban`, { banned, reason }),
    onSuccess: invalidate,
  })
}

export function useQuarantine(status: string) {
  return useQuery({ queryKey: ['admin', 'quarantine', status], queryFn: () => api.get<QuarantineItem[]>(`/admin/quarantine?status=${status}`) })
}

export function useQuarantineAction() {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'approve' | 'delete' }) => api.post(`/admin/quarantine/${id}`, { action }),
    onSuccess: invalidate,
  })
}

export function useAdminContent() {
  return useQuery({ queryKey: ['admin', 'content'], queryFn: () => api.get<AdminContentItem[]>('/admin/content') })
}
