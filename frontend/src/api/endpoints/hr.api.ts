import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'

export interface LeaveRequest {
  id: string
  staff: string
  staff_name: string
  staff_designation: string
  staff_department: string
  leave_type: string
  leave_type_display: string
  status: string
  status_display: string
  start_date: string
  end_date: string
  duration_days: number
  reason: string
  reviewed_by?: string
  reviewed_by_name?: string
  reviewed_at?: string
  review_notes: string
  created_at: string
}

export interface LeaveWritePayload {
  staff: string
  leave_type: string
  start_date: string
  end_date: string
  reason?: string
}

export interface ShiftAssignment {
  id: string
  staff: string
  staff_name: string
  staff_department: string
  shift: string
  shift_display: string
  shift_date: string
  notes: string
}

export interface HRSummary {
  total_staff: number
  present_today: number
  on_leave_today: number
  pending_leave_requests: number
  shifts_today: { morning: number; afternoon: number; night: number }
}

export const hrApi = {
  summary: () =>
    apiClient.get<HRSummary>('/hr/summary/').then((r) => r.data),

  leaveList: (params?: { status?: string; staff?: string; leave_type?: string; page?: number; search?: string }) =>
    apiClient.get<PaginatedResponse<LeaveRequest>>('/hr/leave-requests/', { params }).then((r) => r.data),

  leaveCreate: (data: LeaveWritePayload) =>
    apiClient.post<LeaveRequest>('/hr/leave-requests/', data).then((r) => r.data),

  leaveReview: (id: string, data: { status: 'approved' | 'rejected'; review_notes?: string }) =>
    apiClient.post<LeaveRequest>(`/hr/leave-requests/${id}/review/`, data).then((r) => r.data),

  shiftList: (params?: { shift_date?: string; shift?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<ShiftAssignment>>('/hr/shifts/', { params }).then((r) => r.data),

  shiftCreate: (data: { staff: string; shift: string; shift_date: string; notes?: string }) =>
    apiClient.post<ShiftAssignment>('/hr/shifts/', data).then((r) => r.data),
}
