import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'

export interface Medicine {
  id: string
  name: string
  generic_name: string
  category: string
  category_display?: string
  unit: string
  reorder_level: number
  is_active: boolean
  created_at: string
}

export const pharmacyApi = {
  listMedicines: (params?: { page?: number; search?: string; is_active?: boolean; category?: string }) =>
    apiClient.get<PaginatedResponse<Medicine>>('/pharmacy/medicines/', { params }).then((r) => r.data),

  getMedicine: (id: string) =>
    apiClient.get<Medicine>(`/pharmacy/medicines/${id}/`).then((r) => r.data),
}
