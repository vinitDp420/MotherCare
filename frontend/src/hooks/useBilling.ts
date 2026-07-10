import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billingApi, type BillWritePayload, type PaymentPayload } from '@/api/endpoints/billing.api'

export function useBillsList(params?: { patient?: string; bill_type?: string; payment_status?: string; page?: number; search?: string }) {
  return useQuery({
    queryKey: ['bills-list', params],
    queryFn: () => billingApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useBill(id: string) {
  return useQuery({
    queryKey: ['bill', id],
    queryFn: () => billingApi.get(id),
    enabled: !!id,
  })
}

export function useCreateBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BillWritePayload) => billingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills-list'] })
    },
  })
}

export function useRecordPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentPayload }) =>
      billingApi.recordPayment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bills-list'] })
      queryClient.invalidateQueries({ queryKey: ['bill', id] })
    },
  })
}
