import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'

export interface MedicineStub {
  id: string
  name: string
  generic_name: string
  category: string
  unit: string
}

export interface PrescriptionItem {
  id: string
  prescription: string
  medicine: MedicineStub
  dosage: string
  frequency: string
  frequency_display: string
  duration: string
  duration_days?: number
  route?: string
  quantity_to_dispense?: number
  instructions: string
  sort_order: number
  created_at: string
}

export interface Prescription {
  id: string
  consultation: string
  patient: string
  patient_name: string
  patient_mrn: string
  patient_blood_group?: string
  patient_age?: number
  doctor_name?: string
  doctor_registration_no?: string
  issued_at: string
  notes: string
  item_count: number
  items?: PrescriptionItem[]
  is_dispensed: boolean
  created_at: string
  updated_at?: string
}

export interface PrescriptionItemWritePayload {
  medicine: string
  dosage: string
  frequency: string
  duration: string
  duration_days?: number
  route?: string
  quantity_to_dispense?: number
  instructions?: string
  sort_order?: number
}

export interface PrescriptionWritePayload {
  consultation: string
  patient: string
  notes?: string
  items: PrescriptionItemWritePayload[]
}

export const prescriptionsApi = {
  list: (params?: { patient?: string; consultation?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<Prescription>>('/prescriptions/', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Prescription>(`/prescriptions/${id}/`).then((r) => r.data),

  create: (data: PrescriptionWritePayload) =>
    apiClient.post<Prescription>('/prescriptions/', data).then((r) => r.data),

  history: (patientId: string, limit?: number) =>
    apiClient.get<Prescription[]>(`/prescriptions/history/`, { params: { patient: patientId, limit } }).then((r) => r.data),

  duplicate: (id: string, consultationId: string, patientId: string) =>
    apiClient.post<Prescription>(`/prescriptions/${id}/duplicate/`, { consultation: consultationId, patient: patientId }).then((r) => r.data),
}
