import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { Profile, ProfileInput } from '../../shared/types'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<Profile>('/profile'),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProfileInput) => api.put<Profile>('/profile', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })
}
