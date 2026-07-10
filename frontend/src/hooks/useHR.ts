import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hrApi, type LeaveWritePayload } from '@/api/endpoints/hr.api'

export function useHRSummary() {
  return useQuery({
    queryKey: ['hr-summary'],
    queryFn: () => hrApi.summary(),
    staleTime: 30_000,
  })
}

export function useLeaveRequests(params?: { status?: string; staff?: string; leave_type?: string; page?: number; search?: string }) {
  return useQuery({
    queryKey: ['leave-requests', params],
    queryFn: () => hrApi.leaveList(params),
    placeholderData: (prev) => prev,
  })
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LeaveWritePayload) => hrApi.leaveCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      queryClient.invalidateQueries({ queryKey: ['hr-summary'] })
    },
  })
}

export function useReviewLeave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: 'approved' | 'rejected'; review_notes?: string } }) =>
      hrApi.leaveReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      queryClient.invalidateQueries({ queryKey: ['hr-summary'] })
    },
  })
}

export function useShifts(params?: { shift_date?: string; shift?: string; page?: number }) {
  return useQuery({
    queryKey: ['shifts', params],
    queryFn: () => hrApi.shiftList(params),
    placeholderData: (prev) => prev,
  })
}
