import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { Report, ReportInput, ReportWithDetails, ReportStatus } from '../../shared/types'

export function useCreateReport() {
  return useMutation({
    mutationFn: (input: ReportInput) => api.post<Report>('/reports', input),
  })
}

export function useReports(enabled: boolean) {
  return useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => api.get<ReportWithDetails[]>('/reports'),
    enabled,
  })
}

export function useUpdateReportStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReportStatus }) => api.put<Report>(`/reports?id=${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reports'] }),
  })
}
