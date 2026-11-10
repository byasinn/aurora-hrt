import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { EquippableKind, ShopState } from '../../shared/shopCatalog'
import type { PromoApplied, Promotion } from '../../shared/shopPromos'

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

export function useBuyPotion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (offerKey: string) => api.post<ShopState>('/shop/buy-potion', { offerKey }),
    onSuccess: (state) => {
      qc.setQueryData(['shop'], state)
      qc.invalidateQueries({ queryKey: ['missions'] })
      qc.invalidateQueries({ queryKey: ['points'] })
    },
  })
}

// ---------- admin: promoções ----------

export function useAdminPromotions() {
  return useQuery({
    queryKey: ['admin', 'promotions'],
    queryFn: () => api.get<{ promotions: Promotion[]; today: Record<string, PromoApplied> }>('/admin/promotions'),
  })
}

export type PromotionInput = Omit<Promotion, 'id'> & { id?: number }

export function useSavePromotion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: PromotionInput) => (id ? api.put<Promotion>(`/admin/promotions/${id}`, body) : api.post<Promotion>('/admin/promotions', body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'promotions'] })
      qc.invalidateQueries({ queryKey: ['shop'] })
    },
  })
}

export function useDeletePromotion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/promotions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'promotions'] })
      qc.invalidateQueries({ queryKey: ['shop'] })
    },
  })
}
