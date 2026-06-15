import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'
import type { Doctor, Staff } from '@/types/patient.types'

export interface Department {
  id: string
  name: string
  department_type: string
  is_active: boolean
}

export interface StaffWritePayload {
  user?: string | null
  department?: string | null
  full_name: string
  designation: string
  phone: string
  email?: string
  join_date: string
  is_active?: boolean
}

export interface DoctorWritePayload {
  staff: string
  specialisation: string
  registration_no: string
  available_from?: string | null
  available_to?: string | null
}

export const doctorsApi = {
  // Doctor Endpoints
  list: (params?: { page?: number; search?: string; staff__is_active?: boolean; staff__department?: string }) =>
    apiClient.get<PaginatedResponse<Doctor>>('/doctors/', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Doctor>(`/doctors/${id}/`).then((r) => r.data),

  create: (data: DoctorWritePayload) =>
    apiClient.post<Doctor>('/doctors/', data).then((r) => r.data),

  update: (id: string, data: Partial<DoctorWritePayload>) =>
    apiClient.patch<Doctor>(`/doctors/${id}/`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/doctors/${id}/`).then((r) => r.data),

  // Staff Endpoints
  listStaff: (params?: { page?: number; search?: string; is_active?: boolean; department?: string }) =>
    apiClient.get<PaginatedResponse<Staff>>('/staff/', { params }).then((r) => r.data),

  createStaff: (data: StaffWritePayload) =>
    apiClient.post<Staff>('/staff/', data).then((r) => r.data),

  updateStaff: (id: string, data: Partial<StaffWritePayload>) =>
    apiClient.patch<Staff>(`/staff/${id}/`, data).then((r) => r.data),

  deleteStaff: (id: string) =>
    apiClient.delete(`/staff/${id}/`).then((r) => r.data),

  // Departments
  listDepartments: () =>
    apiClient.get<Department[]>('/hospital/departments/').then((r) => r.data),
}
