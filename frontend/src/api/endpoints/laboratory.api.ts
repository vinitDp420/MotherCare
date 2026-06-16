import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'
import type {
  LabTest,
  LabTestWritePayload,
  LabStatusUpdatePayload,
  LabReportUploadPayload,
  LabReportFile,
} from '@/types/laboratory.types'

export const laboratoryApi = {
  list: (params?: { status?: string; urgency?: string; patient?: string; ordered_by?: string; flagged?: boolean; page?: number; search?: string; consultation?: string }) =>
    apiClient.get<PaginatedResponse<LabTest>>('/laboratory/lab-tests/', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<LabTest>(`/laboratory/lab-tests/${id}/`).then((r) => r.data),

  create: (data: LabTestWritePayload) =>
    apiClient.post<LabTest>('/laboratory/lab-tests/', data).then((r) => r.data),

  updateStatus: (id: string, data: LabStatusUpdatePayload) =>
    apiClient.patch<LabTest>(`/laboratory/lab-tests/${id}/`, data).then((r) => r.data),

  uploadReport: (id: string, data: LabReportUploadPayload) => {
    const formData = new FormData()
    formData.append('file', data.file)
    if (data.notes) {
      formData.append('notes', data.notes)
    }
    return apiClient.post<LabReportFile>(`/laboratory/lab-tests/${id}/upload-report/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then((r) => r.data)
  },

  flag: (id: string, reason?: string) =>
    apiClient.post<LabTest>(`/laboratory/lab-tests/${id}/flag/`, { reason }).then((r) => r.data),

  getQueue: (params?: { urgency?: string; status?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<LabTest>>('/laboratory/lab-tests/queue/', { params }).then((r) => r.data),

  getFlagged: (params?: { limit?: number }) =>
    apiClient.get<LabTest[]>('/laboratory/lab-tests/flagged/', { params }).then((r) => r.data),
}
