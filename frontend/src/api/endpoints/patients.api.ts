import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'
import type {
  Patient,
  PatientWritePayload,
  PatientAllergy,
  PatientAllergyWritePayload,
  PatientEmergencyContact,
  PatientEmergencyContactWritePayload,
  Doctor
} from '@/types/patient.types'

export const patientsApi = {
  list: (params?: { search?: string; is_active?: boolean; blood_group?: string; page?: number; ordering?: string }) =>
    apiClient.get<PaginatedResponse<Patient>>('/patients/', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Patient>(`/patients/${id}/`).then((r) => r.data),

  create: (data: PatientWritePayload) =>
    apiClient.post<Patient>('/patients/', data).then((r) => r.data),

  update: (id: string, data: Partial<PatientWritePayload>) =>
    apiClient.patch<Patient>(`/patients/${id}/`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<{ detail: string }>(`/patients/${id}/`).then((r) => r.data),

  // Allergies sub-resource
  getAllergies: (patientId: string, params?: { page?: number }) =>
    apiClient.get<PaginatedResponse<PatientAllergy>>(`/patients/${patientId}/allergies/`, { params }).then((r) => r.data),

  recordAllergy: (patientId: string, data: PatientAllergyWritePayload) =>
    apiClient.post<PatientAllergy>(`/patients/${patientId}/allergies/`, data).then((r) => r.data),

  deleteAllergy: (patientId: string, allergyId: string) =>
    apiClient.delete(`/patients/${patientId}/allergies/${allergyId}/`).then((r) => r.data),

  // Emergency Contacts sub-resource
  getEmergencyContacts: (patientId: string) =>
    apiClient.get<PatientEmergencyContact[]>(`/patients/${patientId}/emergency-contacts/`).then((r) => r.data),

  addEmergencyContact: (patientId: string, data: PatientEmergencyContactWritePayload) =>
    apiClient.post<PatientEmergencyContact>(`/patients/${patientId}/emergency-contacts/`, data).then((r) => r.data),

  removeEmergencyContact: (patientId: string, linkId: string) =>
    apiClient.delete(`/patients/${patientId}/emergency-contacts/${linkId}/`).then((r) => r.data),

  // Doctors
  listDoctors: (params?: { page?: number; search?: string }) =>
    apiClient.get<PaginatedResponse<Doctor>>('/doctors/', { params }).then((r) => r.data),
}
