import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { labApi, type LabOrderCreatePayload } from '@/api/endpoints/lab.api'

export function useLabTestsCatalog(params?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: ['lab-tests-catalog', params],
    queryFn: () => labApi.listTests(params),
    placeholderData: (prev) => prev,
  })
}

export function useLabOrdersList(params?: { status?: string; patient?: string; doctor?: string; consultation?: string }) {
  return useQuery({
    queryKey: ['lab-orders-list', params],
    queryFn: () => labApi.listOrders(params),
    placeholderData: (prev) => prev,
  })
}

export function useLabOrderDetail(id: string) {
  return useQuery({
    queryKey: ['lab-order', id],
    queryFn: () => labApi.getOrder(id),
    enabled: !!id,
  })
}

export function useCreateLabOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LabOrderCreatePayload) => labApi.createOrder(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders-list'] })
      if (data.consultation) {
        queryClient.invalidateQueries({ queryKey: ['consultation', data.consultation] })
      }
    },
  })
}

export function useUploadLabOrderReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, file }: { orderId: string; file: File }) =>
      labApi.uploadReport(orderId, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders-list'] })
      queryClient.invalidateQueries({ queryKey: ['lab-order', data.lab_order] })
    },
  })
}

export function useReviewLabReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, doctorComment, reportId }: { orderId: string; doctorComment: string; reportId?: string }) =>
      labApi.reviewReport(orderId, doctorComment, reportId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders-list'] })
      queryClient.invalidateQueries({ queryKey: ['lab-order', data.lab_order] })
    },
  })
}
