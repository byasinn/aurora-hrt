import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { EquippableKind, ShopState } from '../../shared/shopCatalog'

export function useShop() {
  return useQuery({
    queryKey: ['shop'],
    queryFn: () => api.get<ShopState>('/shop'),
  })
}

export function useBuyItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemKey: string) => api.post<ShopState>('/shop/buy', { itemKey }),
    onSuccess: (state) => qc.setQueryData(['shop'], state),
  })
}

export function useEquipItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { kind: EquippableKind; itemKey: string | null }) => api.post<ShopState>('/shop/equip', body),
    onSuccess: (state) => {
      qc.setQueryData(['shop'], state)
      // perfil carrega os equipados (tema, calendário, moldura no próprio avatar); feed mostra moldura/borda
      qc.invalidateQueries({ queryKey: ['profile'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}
