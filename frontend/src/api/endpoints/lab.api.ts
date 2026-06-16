import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'

export interface TestMaster {
  id: string
  name: string
  code: string
  category: string
  normal_range: string
  unit: string
  price: string
  turnaround_hours: number
  is_active: boolean
}

export interface LabOrderItem {
  id: string
  test: string
  test_name: string
  test_code: string
  test_category: string
  test_normal_range: string
  test_unit: string
  result_value: string
  result_note: string
  is_abnormal: boolean
}

export interface LabReport {
  id: string
  lab_order: string
  report_file: string
  uploaded_by: string
  uploaded_by_name: string
  uploaded_at: string
  doctor_comment: string
  reviewed_at: string
}

export interface LabOrder {
  id: string
  consultation: string | null
  patient: string
  patient_name: string
  patient_mrn: string
  doctor: string
  doctor_name: string
  status: 'pending' | 'received' | 'in_progress' | 'completed'
  status_display: string
  clinical_note: string
  ordered_at: string
  completed_at: string | null
  items: LabOrderItem[]
  reports: LabReport[]
}

export interface LabOrderCreatePayload {
  consultation: string | null
  patient: string
  doctor: string
  clinical_note: string
  tests: string[] // List of TestMaster IDs
}

export const labApi = {
  listTests: (params?: { category?: string; search?: string }) =>
    apiClient.get<PaginatedResponse<TestMaster>>('/lab/tests/', { params }).then((r) => r.data),

  listOrders: (params?: { status?: string; patient?: string; doctor?: string; consultation?: string }) =>
    apiClient.get<PaginatedResponse<LabOrder>>('/lab/orders/', { params }).then((r) => r.data),

  getOrder: (id: string) =>
    apiClient.get<LabOrder>(`/lab/orders/${id}/`).then((r) => r.data),

  createOrder: (data: LabOrderCreatePayload) =>
    apiClient.post<LabOrder>('/lab/orders/', data).then((r) => r.data),

  uploadReport: (orderId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<LabReport>(`/lab/orders/${orderId}/report/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then((r) => r.data)
  },

  listReports: (orderId: string) =>
    apiClient.get<LabReport[]>(`/lab/orders/${orderId}/report/`).then((r) => r.data),

  reviewReport: (orderId: string, doctorComment: string, reportId?: string) =>
    apiClient.patch<LabReport>(`/lab/orders/${orderId}/review/`, { doctor_comment: doctorComment, report_id: reportId }).then((r) => r.data)
}
