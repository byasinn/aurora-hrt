import { useInfiniteQuery } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { ModerationLogEntryWithDetails } from '../../shared/types'

interface ModerationLogPage {
  items: ModerationLogEntryWithDetails[]
  nextBefore: number | null
}

/** Paginado por cursor (`before`) — sem isso, ações de moderação mais antigas que as 200 mais
 * recentes ficavam invisíveis pra sempre no painel. */
export function useModerationLog(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['admin-moderation-log'],
    queryFn: ({ pageParam }: { pageParam: number | null }) =>
      api.get<ModerationLogPage>(`/admin-moderation-log${pageParam ? `?before=${pageParam}` : ''}`),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.nextBefore,
    enabled,
  })
}
