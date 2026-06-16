import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'
import type {
  Newborn,
  NewbornWritePayload,
  NewbornFeedingLog,
  NewbornFeedingWritePayload,
  NewbornVital,
  NewbornVitalWritePayload,
  NewbornVaccination,
  NewbornVaccinationUpdatePayload,
} from '@/types/newborn.types'

export const newbornApi = {
  list: (params?: { delivery?: string; gender?: string; condition?: string; nicu_required?: boolean; page?: number; search?: string }) =>
    apiClient.get<PaginatedResponse<Newborn>>('/newborns/', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Newborn>(`/newborns/${id}/`).then((r) => r.data),

  create: (data: NewbornWritePayload) =>
    apiClient.post<Newborn>('/newborns/', data).then((r) => r.data),

  update: (id: string, data: Partial<NewbornWritePayload>) =>
    apiClient.patch<Newborn>(`/newborns/${id}/`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<void>(`/newborns/${id}/`).then((r) => r.data),

  // Feeding logs sub-resource
  getFeedingLogs: (id: string, params?: { page?: number }) =>
    apiClient.get<PaginatedResponse<NewbornFeedingLog>>(`/newborns/${id}/feeding/`, { params }).then((r) => r.data),

  recordFeeding: (id: string, data: NewbornFeedingWritePayload) =>
    apiClient.post<NewbornFeedingLog>(`/newborns/${id}/feeding/`, data).then((r) => r.data),

  // Vitals sub-resource
  getVitals: (id: string, params?: { page?: number }) =>
    apiClient.get<PaginatedResponse<NewbornVital>>(`/newborns/${id}/vitals/`, { params }).then((r) => r.data),

  recordVital: (id: string, data: NewbornVitalWritePayload) =>
    apiClient.post<NewbornVital>(`/newborns/${id}/vitals/`, data).then((r) => r.data),

  // Vaccinations
  getVaccinations: (id: string) =>
    apiClient.get<NewbornVaccination[]>(`/newborns/${id}/vaccinations/`).then((r) => r.data),

  updateVaccination: (id: string, data: NewbornVaccinationUpdatePayload) =>
    apiClient.patch<NewbornVaccination>(`/newborns/${id}/update-vaccination/`, data).then((r) => r.data),
}
