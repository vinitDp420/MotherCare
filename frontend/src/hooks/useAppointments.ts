import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi, AppointmentWritePayload } from '@/api/endpoints/appointments.api'

export function useAppointmentsList(params?: { status?: string; appointment_type?: string; doctor?: string; patient?: string; page?: number; appointment_datetime__date?: string }) {
  return useQuery({
    queryKey: ['appointments-list', params],
    queryFn: () => appointmentsApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useTodayAppointments(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['appointments-today', params],
    queryFn: () => appointmentsApi.getToday(params),
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AppointmentWritePayload) => appointmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-list'] })
      queryClient.invalidateQueries({ queryKey: ['appointments-today'] })
    },
  })
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AppointmentWritePayload> }) =>
      appointmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-list'] })
      queryClient.invalidateQueries({ queryKey: ['appointments-today'] })
    },
  })
}

export function useConfirmAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-list'] })
      queryClient.invalidateQueries({ queryKey: ['appointments-today'] })
    },
  })
}

export function useCancelAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => appointmentsApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-list'] })
      queryClient.invalidateQueries({ queryKey: ['appointments-today'] })
    },
  })
}

export function useStartAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.start(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-list'] })
      queryClient.invalidateQueries({ queryKey: ['appointments-today'] })
    },
  })
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-list'] })
      queryClient.invalidateQueries({ queryKey: ['appointments-today'] })
    },
  })
}

export function useNoShowAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.noShow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-list'] })
      queryClient.invalidateQueries({ queryKey: ['appointments-today'] })
    },
  })
}

export function useNextSlot(doctor: string, date: string) {
  return useQuery({
    queryKey: ['next-slot', doctor, date],
    queryFn: () => appointmentsApi.nextSlot(doctor, date),
    enabled: !!doctor && !!date,
  })
}
