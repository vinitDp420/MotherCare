import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'

export interface Bed {
  id: string
  bed_number: string
  ward_type: string
  status: string
  floor: number
  last_cleaned_at?: string
  notes?: string
}

export const bedsApi = {
  list: (params?: { status?: string; ward_type?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Bed>>('/beds/', { params }).then((r) => r.data),
}
