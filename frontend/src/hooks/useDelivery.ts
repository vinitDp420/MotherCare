import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveryApi } from '@/api/endpoints/delivery.api'
import type { DeliveryWritePayload } from '@/types/delivery.types'

export function useDeliveriesList(params?: { admission?: string; patient?: string; doctor?: string; delivery_mode?: string; page?: number; search?: string }) {
  return useQuery({
    queryKey: ['deliveries-list', params],
    queryFn: () => deliveryApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useDelivery(id: string) {
  return useQuery({
    queryKey: ['delivery', id],
    queryFn: () => deliveryApi.get(id),
    enabled: !!id,
  })
}

export function useCreateDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DeliveryWritePayload) => deliveryApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries-list'] })
      queryClient.invalidateQueries({ queryKey: ['newborns-list'] })
    },
  })
}

export function useUpdateDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DeliveryWritePayload> }) =>
      deliveryApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries-list'] })
      queryClient.invalidateQueries({ queryKey: ['delivery', data.id] })
    },
  })
}

export function useDeleteDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deliveryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries-list'] })
    },
  })
}
