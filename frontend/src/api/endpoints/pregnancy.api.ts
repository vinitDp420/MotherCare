import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'
import type {
  Pregnancy,
  PregnancyWritePayload,
  AncVisit,
  AncVisitWritePayload,
  PregnancyRiskEvent,
  RiskEventWritePayload,
  Vaccination,
  VaccinationWritePayload,
  WellnessPlan,
  WellnessPlanWritePayload
} from '@/types/pregnancy.types'

export const pregnancyApi = {
  list: (params?: { risk_status?: string; is_active?: boolean; trimester?: number; patient?: string; assigned_doctor?: string; page?: number; search?: string }) =>
    apiClient.get<PaginatedResponse<Pregnancy>>('/pregnancies/pregnancies/', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Pregnancy>(`/pregnancies/pregnancies/${id}/`).then((r) => r.data),

  create: (data: PregnancyWritePayload) =>
    apiClient.post<Pregnancy>('/pregnancies/pregnancies/', data).then((r) => r.data),

  update: (id: string, data: Partial<PregnancyWritePayload>) =>
    apiClient.patch<Pregnancy>(`/pregnancies/pregnancies/${id}/`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<{ detail: string }>(`/pregnancies/pregnancies/${id}/`).then((r) => r.data),

  // ANC Visits
  getAncVisits: (pregnancyId: string, params?: { page?: number }) =>
    apiClient.get<PaginatedResponse<AncVisit>>(`/pregnancies/pregnancies/${pregnancyId}/anc-visits/`, { params }).then((r) => r.data),

  recordAncVisit: (pregnancyId: string, data: AncVisitWritePayload) =>
    apiClient.post<AncVisit>(`/pregnancies/pregnancies/${pregnancyId}/anc-visits/`, data).then((r) => r.data),

  updateAncVisit: (pregnancyId: string, visitId: string, data: Partial<AncVisitWritePayload>) =>
    apiClient.patch<AncVisit>(`/pregnancies/pregnancies/${pregnancyId}/anc-visits/${visitId}/`, data).then((r) => r.data),

  deleteAncVisit: (pregnancyId: string, visitId: string) =>
    apiClient.delete(`/pregnancies/pregnancies/${pregnancyId}/anc-visits/${visitId}/`).then((r) => r.data),

  // Risk Events
  getRiskEvents: (pregnancyId: string) =>
    apiClient.get<PregnancyRiskEvent[]>(`/pregnancies/pregnancies/${pregnancyId}/risk-events/`).then((r) => r.data),

  recordRiskEvent: (pregnancyId: string, data: RiskEventWritePayload) =>
    apiClient.post<PregnancyRiskEvent>(`/pregnancies/pregnancies/${pregnancyId}/risk-events/`, data).then((r) => r.data),

  // Vaccinations
  getVaccinations: (pregnancyId: string) =>
    apiClient.get<Vaccination[]>(`/pregnancies/pregnancies/${pregnancyId}/vaccinations/`).then((r) => r.data),

  addVaccination: (pregnancyId: string, data: VaccinationWritePayload) =>
    apiClient.post<Vaccination>(`/pregnancies/pregnancies/${pregnancyId}/vaccinations/`, data).then((r) => r.data),

  updateVaccinationStatus: (pregnancyId: string, vaccId: string, data: Partial<VaccinationWritePayload>) =>
    apiClient.patch<Vaccination>(`/pregnancies/pregnancies/${pregnancyId}/vaccinations/${vaccId}/`, data).then((r) => r.data),

  // Wellness Plan
  getWellnessPlan: (pregnancyId: string) =>
    apiClient.get<WellnessPlan>(`/pregnancies/pregnancies/${pregnancyId}/wellness-plan/`).then((r) => r.data),

  updateWellnessPlan: (pregnancyId: string, data: WellnessPlanWritePayload) =>
    apiClient.patch<WellnessPlan>(`/pregnancies/pregnancies/${pregnancyId}/wellness-plan/`, data).then((r) => r.data),

  // Sync Week
  syncWeek: (pregnancyId: string) =>
    apiClient.post<{ detail: string; current_week: number; trimester: number }>(`/pregnancies/pregnancies/${pregnancyId}/sync-week/`).then((r) => r.data),
}
