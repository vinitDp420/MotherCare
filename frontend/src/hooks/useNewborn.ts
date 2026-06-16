import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { newbornApi } from '@/api/endpoints/newborn.api'
import type {
  NewbornWritePayload,
  NewbornFeedingWritePayload,
  NewbornVitalWritePayload,
  NewbornVaccinationUpdatePayload,
} from '@/types/newborn.types'

export function useNewbornsList(params?: { delivery?: string; gender?: string; condition?: string; nicu_required?: boolean; page?: number; search?: string }) {
  return useQuery({
    queryKey: ['newborns-list', params],
    queryFn: () => newbornApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useNewbornDetail(id: string) {
  return useQuery({
    queryKey: ['newborn', id],
    queryFn: () => newbornApi.get(id),
    enabled: !!id,
  })
}

export function useCreateNewborn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: NewbornWritePayload) => newbornApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newborns-list'] })
    },
  })
}

export function useUpdateNewborn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewbornWritePayload> }) =>
      newbornApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['newborns-list'] })
      queryClient.invalidateQueries({ queryKey: ['newborn', data.id] })
    },
  })
}

export function useNewbornFeedingLogs(id: string, params?: { page?: number }) {
  return useQuery({
    queryKey: ['newborn-feeding-logs', id, params],
    queryFn: () => newbornApi.getFeedingLogs(id, params),
    enabled: !!id,
  })
}

export function useRecordNewbornFeeding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NewbornFeedingWritePayload }) =>
      newbornApi.recordFeeding(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['newborn', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['newborn-feeding-logs', variables.id] })
    },
  })
}

export function useNewbornVitals(id: string, params?: { page?: number }) {
  return useQuery({
    queryKey: ['newborn-vitals', id, params],
    queryFn: () => newbornApi.getVitals(id, params),
    enabled: !!id,
  })
}

export function useRecordNewbornVital() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NewbornVitalWritePayload }) =>
      newbornApi.recordVital(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['newborn', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['newborn-vitals', variables.id] })
    },
  })
}

export function useNewbornVaccinations(id: string) {
  return useQuery({
    queryKey: ['newborn-vaccinations', id],
    queryFn: () => newbornApi.getVaccinations(id),
    enabled: !!id,
  })
}

export function useUpdateNewbornVaccination() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NewbornVaccinationUpdatePayload }) =>
      newbornApi.updateVaccination(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['newborn', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['newborn-vaccinations', variables.id] })
    },
  })
}
