import { useQuery } from '@tanstack/react-query'
import { admissionsApi } from '@/api/endpoints/admissions.api'

export function useAdmissionsList(params?: { patient?: string; doctor?: string; status?: string; page?: number; search?: string }) {
  return useQuery({
    queryKey: ['admissions-list', params],
    queryFn: () => admissionsApi.list(params),
    placeholderData: (prev) => prev,
  })
}
