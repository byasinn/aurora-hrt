import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { PublicUser } from '../../shared/types'

export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api.get<PublicUser>('/auth-me'),
    retry: false,
    enabled,
  })
}

export function useSignup() {
  return useMutation({
    mutationFn: (input: { email: string; password: string; termsAccepted: boolean; ageConfirmed: boolean }) =>
      api.post<{ ok: true; message: string }>('/auth-signup', input),
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { email: string; password: string }) => api.post<PublicUser>('/auth-login', input),
    onSuccess: (user) => qc.setQueryData(['auth-me'], user),
  })
}

export function useVerifyEmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { token: string }) => api.post<PublicUser>('/auth-verify-email', input),
    onSuccess: (user) => qc.setQueryData(['auth-me'], user),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<{ ok: true }>('/auth-logout', {}),
    onSuccess: () => {
      qc.setQueryData(['auth-me'], undefined)
      qc.clear()
    },
  })
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (input: { email: string }) => api.post<{ ok: true; message: string }>('/auth-request-reset', input),
  })
}

export function useResetPassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { token: string; newPassword: string }) =>
      api.post<PublicUser>('/auth-reset-password', input),
    onSuccess: (user) => qc.setQueryData(['auth-me'], user),
  })
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (input: { email: string }) =>
      api.post<{ ok: true; message: string }>('/auth-resend-verification', input),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete<{ ok: true }>('/auth-delete-account'),
    onSuccess: () => {
      qc.setQueryData(['auth-me'], undefined)
      qc.clear()
    },
  })
}
