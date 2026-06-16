import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { referralsApi, type StitchFileCreatePayload } from '@/api/endpoints/referrals.api'

export function useReferralsList(params?: { patient?: string; urgency?: string; search?: string }) {
  return useQuery({
    queryKey: ['referrals-list', params],
    queryFn: () => referralsApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useReferralDetail(id: string) {
  return useQuery({
    queryKey: ['referral-detail', id],
    queryFn: () => referralsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateReferral() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: StitchFileCreatePayload) => referralsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals-list'] })
    },
  })
}
