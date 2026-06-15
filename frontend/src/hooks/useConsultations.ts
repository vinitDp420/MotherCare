import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { consultationsApi, ConsultationWritePayload, ConsultationUpdatePayload, FollowUpPayload } from '@/api/endpoints/consultations.api'

export function useConsultationsList(params?: { status?: string; doctor?: string; patient?: string; appointment?: string; page?: number }) {
  return useQuery({
    queryKey: ['consultations-list', params],
    queryFn: () => consultationsApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useConsultation(id: string) {
  return useQuery({
    queryKey: ['consultation', id],
    queryFn: () => consultationsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateConsultation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ConsultationWritePayload) => consultationsApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['consultations-list'] })
      queryClient.invalidateQueries({ queryKey: ['appointments-list'] })
      queryClient.invalidateQueries({ queryKey: ['appointments-today'] })
      queryClient.invalidateQueries({ queryKey: ['consultation', data.id] })
    },
  })
}

export function useUpdateConsultation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConsultationUpdatePayload }) =>
      consultationsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['consultations-list'] })
      queryClient.invalidateQueries({ queryKey: ['consultation', data.id] })
    },
  })
}

export function useCompleteConsultation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: { clinical_notes?: string; diagnosis?: string } }) =>
      consultationsApi.complete(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['consultations-list'] })
      queryClient.invalidateQueries({ queryKey: ['appointments-list'] })
      queryClient.invalidateQueries({ queryKey: ['appointments-today'] })
      queryClient.invalidateQueries({ queryKey: ['consultation', data.id] })
    },
  })
}

export function useCancelConsultation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      consultationsApi.cancel(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['consultations-list'] })
      queryClient.invalidateQueries({ queryKey: ['appointments-list'] })
      queryClient.invalidateQueries({ queryKey: ['appointments-today'] })
      queryClient.invalidateQueries({ queryKey: ['consultation', data.id] })
    },
  })
}

export function useFollowUpConsultation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FollowUpPayload }) =>
      consultationsApi.followUp(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['consultation', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['appointments-list'] })
      queryClient.invalidateQueries({ queryKey: ['appointments-today'] })
    },
  })
}
