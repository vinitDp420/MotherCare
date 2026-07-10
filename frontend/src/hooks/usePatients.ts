import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { patientsApi } from '@/api/endpoints/patients.api'
import type { PatientWritePayload, PatientAllergyWritePayload, PatientEmergencyContactWritePayload } from '@/types/patient.types'

export function usePatientsList(params?: { search?: string; is_active?: boolean; blood_group?: string; page?: number; ordering?: string }) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => patientsApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export function usePatientDetail(id?: string) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsApi.get(id!),
    enabled: !!id,
  })
}

export function useCreatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PatientWritePayload) => patientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}

export function useUpdatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PatientWritePayload> }) =>
      patientsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      queryClient.invalidateQueries({ queryKey: ['patient', data.id] })
    },
  })
}

export function useDeletePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => patientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}

// Allergies hooks
export function usePatientAllergies(patientId?: string, params?: { page?: number }) {
  return useQuery({
    queryKey: ['patient-allergies', patientId, params],
    queryFn: () => patientsApi.getAllergies(patientId!, params),
    enabled: !!patientId,
  })
}

export function useRecordPatientAllergy(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PatientAllergyWritePayload) => patientsApi.recordAllergy(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-allergies', patientId] })
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
    },
  })
}

export function useDeletePatientAllergy(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (allergyId: string) => patientsApi.deleteAllergy(patientId, allergyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-allergies', patientId] })
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
    },
  })
}

// Emergency Contacts hooks
export function usePatientEmergencyContacts(patientId?: string) {
  return useQuery({
    queryKey: ['patient-contacts', patientId],
    queryFn: () => patientsApi.getEmergencyContacts(patientId!),
    enabled: !!patientId,
  })
}

export function useAddEmergencyContact(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PatientEmergencyContactWritePayload) => patientsApi.addEmergencyContact(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-contacts', patientId] })
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
    },
  })
}

export function useRemoveEmergencyContact(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (linkId: string) => patientsApi.removeEmergencyContact(patientId, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-contacts', patientId] })
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
    },
  })
}

// Doctors hooks
export function useDoctorsList(params?: { page?: number; search?: string }) {
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: () => patientsApi.listDoctors(params),
  })
}

// Staff hooks
export function useStaffList(params?: { page?: number; search?: string; department?: string }) {
  return useQuery({
    queryKey: ['staff', params],
    queryFn: () => patientsApi.listStaff(params),
    placeholderData: (prev) => prev,
  })
}
