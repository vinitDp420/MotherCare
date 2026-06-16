import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'

export interface StitchFile {
  id: string
  patient: string
  patient_name: string
  patient_mrn: string
  created_by: string
  created_by_name: string
  specialist_type: string
  urgency: 'routine' | 'urgent' | 'emergency'
  reason: string
  referral_note: string
  attached_reports: any[]
  attached_prescriptions: any[]
  created_at: string
  updated_at: string
}

export interface StitchFileCreatePayload {
  patient: string
  specialist_type: string
  urgency: 'routine' | 'urgent' | 'emergency'
  reason: string
  referral_note?: string
  attached_report_ids?: string[]
  attached_prescription_ids?: string[]
}

export const referralsApi = {
  list: (params?: { patient?: string; urgency?: string; search?: string }) =>
    apiClient.get<PaginatedResponse<StitchFile>>('/referrals/stitch/', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<StitchFile>(`/referrals/stitch/${id}/`).then((r) => r.data),

  create: (data: StitchFileCreatePayload) =>
    apiClient.post<StitchFile>('/referrals/stitch/', data).then((r) => r.data),

  exportUrl: (id: string) =>
    `${apiClient.defaults.baseURL}/referrals/stitch/${id}/export/`,
}
