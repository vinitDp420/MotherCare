import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'

export interface Appointment {
  id: string
  patient: string
  patient_name: string
  patient_mrn: string
  patient_blood_group?: string
  doctor: string
  doctor_name: string
  appointment_datetime: string
  token_number: number
  status: string
  appointment_type: string
  type_display?: string
  status_display: string
  is_terminal?: boolean
  has_consultation?: boolean
  notes?: string
  created_at?: string
}

export interface AppointmentWritePayload {
  patient: string
  doctor: string
  appointment_datetime: string
  appointment_type: string
  notes?: string
}

export const appointmentsApi = {
  list: (params?: { status?: string; appointment_type?: string; doctor?: string; patient?: string; page?: number; appointment_datetime__date?: string }) =>
    apiClient.get<PaginatedResponse<Appointment>>('/appointments/appointments/', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Appointment>(`/appointments/appointments/${id}/`).then((r) => r.data),

  create: (data: AppointmentWritePayload) =>
    apiClient.post<Appointment>('/appointments/appointments/', data).then((r) => r.data),

  update: (id: string, data: Partial<AppointmentWritePayload>) =>
    apiClient.patch<Appointment>(`/appointments/appointments/${id}/`, data).then((r) => r.data),

  getToday: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Appointment>>('/appointments/appointments/today/', { params }).then((r) => r.data),

  confirm: (id: string) =>
    apiClient.post<Appointment>(`/appointments/appointments/${id}/confirm/`).then((r) => r.data),

  cancel: (id: string, reason?: string) =>
    apiClient.post<Appointment>(`/appointments/appointments/${id}/cancel/`, { reason }).then((r) => r.data),

  start: (id: string) =>
    apiClient.post<Appointment>(`/appointments/appointments/${id}/start/`).then((r) => r.data),

  complete: (id: string) =>
    apiClient.post<Appointment>(`/appointments/appointments/${id}/complete/`).then((r) => r.data),

  noShow: (id: string) =>
    apiClient.post<Appointment>(`/appointments/appointments/${id}/no-show/`).then((r) => r.data),

  nextSlot: (doctor: string, date: string) =>
    apiClient.get<{ doctor: string; date: string; next_available_slot: string | null; available: boolean }>(
      '/appointments/appointments/next-slot/',
      { params: { doctor, date } }
    ).then((r) => r.data),
}
