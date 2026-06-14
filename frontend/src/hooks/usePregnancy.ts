import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pregnancyApi } from '@/api/endpoints/pregnancy.api'
import type {
  PregnancyWritePayload,
  AncVisitWritePayload,
  RiskEventWritePayload,
  VaccinationWritePayload,
  WellnessPlanWritePayload
} from '@/types/pregnancy.types'

export function usePregnancyList(params?: { risk_status?: string; is_active?: boolean; trimester?: number; patient?: string; assigned_doctor?: string; page?: number; search?: string }) {
  return useQuery({
    queryKey: ['pregnancies', params],
    queryFn: () => pregnancyApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export function usePregnancyDetail(id?: string) {
  return useQuery({
    queryKey: ['pregnancy', id],
    queryFn: () => pregnancyApi.get(id!),
    enabled: !!id,
  })
}

export function useCreatePregnancy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PregnancyWritePayload) => pregnancyApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pregnancies'] })
      queryClient.invalidateQueries({ queryKey: ['patient', data.patient] })
    },
  })
}

export function useUpdatePregnancy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PregnancyWritePayload> }) =>
      pregnancyApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pregnancies'] })
      queryClient.invalidateQueries({ queryKey: ['pregnancy', data.id] })
      queryClient.invalidateQueries({ queryKey: ['patient', data.patient] })
    },
  })
}

export function useDeletePregnancy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pregnancyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancies'] })
    },
  })
}

// ANC Visits
export function usePregnancyAncVisits(pregnancyId?: string, params?: { page?: number }) {
  return useQuery({
    queryKey: ['pregnancy-anc-visits', pregnancyId, params],
    queryFn: () => pregnancyApi.getAncVisits(pregnancyId!, params),
    enabled: !!pregnancyId,
  })
}

export function useRecordAncVisit(pregnancyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AncVisitWritePayload) => pregnancyApi.recordAncVisit(pregnancyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy-anc-visits', pregnancyId] })
      queryClient.invalidateQueries({ queryKey: ['pregnancy', pregnancyId] })
    },
  })
}

export function useUpdateAncVisit(pregnancyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ visitId, data }: { visitId: string; data: Partial<AncVisitWritePayload> }) =>
      pregnancyApi.updateAncVisit(pregnancyId, visitId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy-anc-visits', pregnancyId] })
      queryClient.invalidateQueries({ queryKey: ['pregnancy', pregnancyId] })
    },
  })
}

export function useDeleteAncVisit(pregnancyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (visitId: string) => pregnancyApi.deleteAncVisit(pregnancyId, visitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy-anc-visits', pregnancyId] })
      queryClient.invalidateQueries({ queryKey: ['pregnancy', pregnancyId] })
    },
  })
}

// Risk Events
export function usePregnancyRiskEvents(pregnancyId?: string) {
  return useQuery({
    queryKey: ['pregnancy-risk-events', pregnancyId],
    queryFn: () => pregnancyApi.getRiskEvents(pregnancyId!),
    enabled: !!pregnancyId,
  })
}

export function useRecordRiskEvent(pregnancyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RiskEventWritePayload) => pregnancyApi.recordRiskEvent(pregnancyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy-risk-events', pregnancyId] })
      queryClient.invalidateQueries({ queryKey: ['pregnancy', pregnancyId] })
    },
  })
}

// Vaccinations
export function usePregnancyVaccinations(pregnancyId?: string) {
  return useQuery({
    queryKey: ['pregnancy-vaccinations', pregnancyId],
    queryFn: () => pregnancyApi.getVaccinations(pregnancyId!),
    enabled: !!pregnancyId,
  })
}

export function useAddVaccination(pregnancyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: VaccinationWritePayload) => pregnancyApi.addVaccination(pregnancyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy-vaccinations', pregnancyId] })
      queryClient.invalidateQueries({ queryKey: ['pregnancy', pregnancyId] })
    },
  })
}

export function useUpdateVaccinationStatus(pregnancyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ vaccId, data }: { vaccId: string; data: Partial<VaccinationWritePayload> }) =>
      pregnancyApi.updateVaccinationStatus(pregnancyId, vaccId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy-vaccinations', pregnancyId] })
      queryClient.invalidateQueries({ queryKey: ['pregnancy', pregnancyId] })
    },
  })
}

// Wellness Plan
export function usePregnancyWellnessPlan(pregnancyId?: string) {
  return useQuery({
    queryKey: ['pregnancy-wellness-plan', pregnancyId],
    queryFn: () => pregnancyApi.getWellnessPlan(pregnancyId!),
    enabled: !!pregnancyId,
  })
}

export function useUpdateWellnessPlan(pregnancyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: WellnessPlanWritePayload) => pregnancyApi.updateWellnessPlan(pregnancyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy-wellness-plan', pregnancyId] })
      queryClient.invalidateQueries({ queryKey: ['pregnancy', pregnancyId] })
    },
  })
}

// Sync Week
export function useSyncPregnancyWeek() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (pregnancyId: string) => pregnancyApi.syncWeek(pregnancyId),
    onSuccess: (data, pregnancyId) => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy', pregnancyId] })
      queryClient.invalidateQueries({ queryKey: ['pregnancies'] })
    },
  })
}
