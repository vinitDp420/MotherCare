import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doctorsApi, StaffWritePayload, DoctorWritePayload } from '@/api/endpoints/doctors.api'

export function useDoctorsQuery(params?: { page?: number; search?: string; staff__is_active?: boolean; staff__department?: string }) {
  return useQuery({
    queryKey: ['doctors-list', params],
    queryFn: () => doctorsApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useDoctorDetail(id?: string) {
  return useQuery({
    queryKey: ['doctor-detail', id],
    queryFn: () => doctorsApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateDoctor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DoctorWritePayload) => doctorsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors-list'] })
      queryClient.invalidateQueries({ queryKey: ['doctors'] }) // Invalidate hook in usePatients
    },
  })
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DoctorWritePayload> }) =>
      doctorsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctors-list'] })
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-detail', data.id] })
    },
  })
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => doctorsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors-list'] })
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
    },
  })
}

export function useStaffList(params?: { page?: number; search?: string; is_active?: boolean; department?: string }) {
  return useQuery({
    queryKey: ['staff-list', params],
    queryFn: () => doctorsApi.listStaff(params),
    placeholderData: (prev) => prev,
  })
}

export function useCreateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: StaffWritePayload) => doctorsApi.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-list'] })
    },
  })
}

export function useUpdateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StaffWritePayload> }) =>
      doctorsApi.updateStaff(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-list'] })
      queryClient.invalidateQueries({ queryKey: ['doctors-list'] })
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
    },
  })
}

export function useDeleteStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => doctorsApi.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-list'] })
      queryClient.invalidateQueries({ queryKey: ['doctors-list'] })
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
    },
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments-list'],
    queryFn: () => doctorsApi.listDepartments(),
  })
}
