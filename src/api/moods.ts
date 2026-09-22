import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { MoodEntry, MoodEntryInput } from '../../shared/types'

export function useMoodEntries(params: { from?: string; to?: string } = {}) {
  const qs = new URLSearchParams()
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  const query = qs.toString()

  return useQuery({
    queryKey: ['mood-entries', params],
    queryFn: () => api.get<MoodEntry[]>(`/moods${query ? `?${query}` : ''}`),
  })
}

/** Substitui/insere `entry` em qualquer query de mood-entries já em cache, por data — usado depois
 * de criar/editar pra a tela atualizar na hora, sem esperar o refetch de invalidateQueries (esse
 * atraso era o que fazia o check-in "demorar pra aparecer" e abrir uma janela pra clique duplo criar
 * um registro repetido do mesmo dia). */
function upsertInCache(qc: ReturnType<typeof useQueryClient>, entry: MoodEntry) {
  qc.setQueriesData<MoodEntry[]>({ queryKey: ['mood-entries'] }, (old) => {
    if (!old) return old
    return [...old.filter((e) => e.date !== entry.date), entry]
  })
}

export function useCreateMoodEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MoodEntryInput) => api.post<MoodEntry>('/moods', input),
    onSuccess: (entry) => {
      upsertInCache(qc, entry)
      qc.invalidateQueries({ queryKey: ['mood-entries'] })
    },
  })
}

export function useUpdateMoodEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<MoodEntryInput> & { id: number }) =>
      api.put<MoodEntry>(`/moods?id=${id}`, input),
    onSuccess: (entry) => {
      upsertInCache(qc, entry)
      qc.invalidateQueries({ queryKey: ['mood-entries'] })
    },
  })
}
