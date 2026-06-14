import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'

export interface Appointment {
  id: string
  patient: string
  patient_name: string
  patient_mrn: string
  doctor: string
  doctor_name: string
  appointment_datetime: string
  token_number: number
  status: string
  appointment_type: string
  appointment_type_display: string
  status_display: string
  notes?: string
}

export const appointmentsApi = {
  list: (params?: { status?: string; appointment_type?: string; doctor?: string; patient?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<Appointment>>('/appointments/', { params }).then((r) => r.data),

  getToday: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Appointment>>('/appointments/today/', { params }).then((r) => r.data),
}
