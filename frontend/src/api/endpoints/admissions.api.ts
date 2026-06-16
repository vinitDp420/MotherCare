import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'

export interface Admission {
  id: string;
  patient: string;
  patient_name: string;
  patient_mrn: string;
  doctor: string;
  doctor_name: string;
  admission_datetime: string;
  admission_type: string;
  status: string;
  room_number: string;
  bed_number: string;
  reason: string;
}

export const admissionsApi = {
  list: (params?: { patient?: string; doctor?: string; status?: string; page?: number; search?: string }) =>
    apiClient.get<PaginatedResponse<Admission>>('/admissions/', { params }).then((r) => r.data),
}
