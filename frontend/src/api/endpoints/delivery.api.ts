import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'
import type { Delivery, DeliveryWritePayload } from '@/types/delivery.types'

export const deliveryApi = {
  list: (params?: { admission?: string; patient?: string; doctor?: string; delivery_mode?: string; page?: number; search?: string }) =>
    apiClient.get<PaginatedResponse<Delivery>>('/delivery/', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Delivery>(`/delivery/${id}/`).then((r) => r.data),

  create: (data: DeliveryWritePayload) =>
    apiClient.post<Delivery>('/delivery/', data).then((r) => r.data),

  update: (id: string, data: Partial<DeliveryWritePayload>) =>
    apiClient.patch<Delivery>(`/delivery/${id}/`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<void>(`/delivery/${id}/`).then((r) => r.data),
}
