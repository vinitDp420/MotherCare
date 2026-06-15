import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { prescriptionsApi, PrescriptionWritePayload } from '@/api/endpoints/prescriptions.api'

export function usePrescription(id: string) {
  return useQuery({
    queryKey: ['prescription', id],
    queryFn: () => prescriptionsApi.get(id),
    enabled: !!id,
  })
}

export function usePrescriptionHistory(patientId: string, limit?: number) {
  return useQuery({
    queryKey: ['prescription-history', patientId, limit],
    queryFn: () => prescriptionsApi.history(patientId, limit),
    enabled: !!patientId,
  })
}

export function useCreatePrescription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PrescriptionWritePayload) => prescriptionsApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['prescription-history', data.patient] })
      queryClient.invalidateQueries({ queryKey: ['consultation', data.consultation] })
    },
  })
}
