import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bedsApi, type Bed } from '@/api/endpoints/beds.api'

export function useBedsList(params?: { status?: string; ward_type?: string; page?: number }) {
  return useQuery({
    queryKey: ['beds-list', params],
    queryFn: () => bedsApi.list(params),
    placeholderData: (prev) => prev,
    staleTime: 15_000,
  })
}
