import type { AuditFields, SoftDeleteFields, RiskStatus, AllergySeverity } from './common.types'

export interface Patient {
  id: string
  mrn: string
  full_name: string
  dob: string
  age: number
  blood_group: string
  phone: string
  alt_phone?: string
  email?: string
  address?: string
  is_active: boolean
  is_deleted?: boolean
  deleted_at?: string | null
  allergy_count?: number
  has_blocking_allergies?: boolean
  primary_contact?: {
    name: string
    phone: string
    relationship_type: string
  } | null
  created_at: string
  updated_at?: string
  created_by?: string | null
}

export interface PatientWritePayload {
  full_name: string
  dob: string
  blood_group: string
  phone: string
  alt_phone?: string
  email?: string
  address?: string
  is_active?: boolean
}

export interface EmergencyContact {
  id: string
  name: string
  phone: string
  alt_phone?: string
  email?: string
  created_at?: string
}

export interface PatientEmergencyContact {
  id: string
  contact: EmergencyContact
  relationship_type: 'spouse' | 'parent' | 'sibling' | 'child' | 'other'
  priority: number
  is_primary: boolean
  created_at: string
}

export interface PatientEmergencyContactWritePayload {
  contact_id?: string
  name?: string
  phone?: string
  alt_phone?: string
  email?: string
  relationship_type: 'spouse' | 'parent' | 'sibling' | 'child' | 'other'
  priority: number
}

export interface PatientAllergy {
  id: string
  allergen: string
  reaction_type: string
  severity: AllergySeverity
  is_blocking: boolean
  recorded_date: string
  recorded_by?: string | null
  notes: string
  created_at: string
}

export interface PatientAllergyWritePayload {
  allergen: string
  reaction_type: string
  severity: AllergySeverity
  recorded_date: string
  notes?: string
}

export interface Staff {
  id: string
  full_name: string
  designation: string
  department?: string | null
  department_name?: string | null
  user?: string | null
  user_username?: string | null
  phone: string
  email?: string
  join_date: string
  is_active: boolean
  doctor_profile?: {
    id: string
    specialisation: string
    registration_no: string
    available_from: string | null
    available_to: string | null
  } | null
  created_at?: string
  updated_at?: string
}

export interface Doctor {
  id: string
  full_name: string
  specialisation: string
  registration_no: string
  department_name?: string | null
  available_from: string | null
  available_to: string | null
  is_active: boolean
}
