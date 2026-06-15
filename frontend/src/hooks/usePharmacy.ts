import { useQuery } from '@tanstack/react-query'
import { pharmacyApi } from '@/api/endpoints/pharmacy.api'

export function useMedicinesSearch(params?: { search?: string; is_active?: boolean; category?: string; page?: number }) {
  return useQuery({
    queryKey: ['medicines-search', params],
    queryFn: () => pharmacyApi.listMedicines(params),
    // We only enable if search query has length >= 2 or if we just want a list of all active medicines
    enabled: true,
  })
}
