import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'

export interface ActivePregnancy {
  id: string
  current_week: number
  trimester: number
  edd: string
  risk_status: string
  gravida: number
  para: number
}

export interface PatientAllergy {
  allergen: string
  severity: string
  reaction_type: string
}

export interface PreviousPrescription {
  id: string
  issued_at: string
  consultation_id: string
  notes: string
}

export interface Consultation {
  id: string
  appointment: string
  appointment_type: string
  appointment_token: number
  patient: string
  patient_name: string
  patient_mrn: string
  patient_blood_group: string
  patient_dob: string
  doctor: string
  doctor_name: string
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  status: 'in_progress' | 'completed' | 'cancelled'
  status_display: string
  is_terminal: boolean
  clinical_notes: string
  diagnosis: string
  follow_up_datetime: string | null
  previous_prescriptions: PreviousPrescription[]
  patient_allergies: PatientAllergy[]
  active_pregnancy: ActivePregnancy | null
  created_at: string
  updated_at: string
}

export interface ConsultationWritePayload {
  appointment: string
  clinical_notes?: string
  diagnosis?: string
}

export interface ConsultationUpdatePayload {
  clinical_notes?: string
  diagnosis?: string
}

export interface FollowUpPayload {
  follow_up_datetime: string
  notes?: string
}

export const consultationsApi = {
  list: (params?: { status?: string; doctor?: string; patient?: string; appointment?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<Consultation>>('/consultations/consultations/', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Consultation>(`/consultations/consultations/${id}/`).then((r) => r.data),

  create: (data: ConsultationWritePayload) =>
    apiClient.post<Consultation>('/consultations/consultations/', data).then((r) => r.data),

  update: (id: string, data: ConsultationUpdatePayload) =>
    apiClient.patch<Consultation>(`/consultations/consultations/${id}/`, data).then((r) => r.data),

  complete: (id: string, data?: { clinical_notes?: string; diagnosis?: string }) =>
    apiClient.post<Consultation>(`/consultations/consultations/${id}/complete/`, data).then((r) => r.data),

  cancel: (id: string, reason?: string) =>
    apiClient.post<Consultation>(`/consultations/consultations/${id}/cancel/`, { reason }).then((r) => r.data),

  followUp: (id: string, data: FollowUpPayload) =>
    apiClient.post<any>(`/consultations/consultations/${id}/follow-up/`, data).then((r) => r.data),
}
