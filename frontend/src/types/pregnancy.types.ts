import type { RiskStatus, AllergySeverity, VaccinationStatus, AppointmentStatus } from './common.types'

export interface Pregnancy {
  id: string
  patient: string
  patient_name: string
  patient_mrn: string
  patient_blood_group?: string
  assigned_doctor?: string | null
  doctor_name?: string
  lmp: string
  edd: string
  current_week: number
  trimester: number
  trimester_display: string
  risk_status: RiskStatus
  risk_status_display: string
  is_high_risk: boolean
  gravida: number
  para: number
  chronic_conditions?: string
  is_active: boolean
  is_deleted?: boolean
  deleted_at?: string | null
  recent_anc_visits?: AncVisit[]
  recent_risk_events?: PregnancyRiskEvent[]
  vaccinations_summary?: {
    total: number
    administered: number
    due: number
    skipped: number
  }
  wellness_plan?: WellnessPlan | null
  created_at: string
  updated_at?: string
}

export interface PregnancyWritePayload {
  patient: string
  assigned_doctor?: string | null
  lmp: string
  edd?: string | null
  risk_status?: RiskStatus
  gravida: number
  para: number
  chronic_conditions?: string
  is_active?: boolean
}

export interface AncVisit {
  id: string
  pregnancy: string
  doctor: string
  doctor_name: string
  visit_date: string
  week_at_visit: number
  visit_type: string
  visit_type_display: string
  bp_systolic?: number | null
  bp_diastolic?: number | null
  weight_kg?: string | null
  fhr_bpm?: number | null
  glucose_mgdl?: string | null
  notes?: string
  created_at: string
  updated_at: string
}

export interface AncVisitWritePayload {
  doctor: string
  visit_date: string
  week_at_visit: number
  visit_type: string
  bp_systolic?: number | null
  bp_diastolic?: number | null
  weight_kg?: number | null
  fhr_bpm?: number | null
  glucose_mgdl?: number | null
  notes?: string
}

export interface PregnancyRiskEvent {
  id: string
  pregnancy: string
  event_date: string
  week_number: number
  risk_level: 'low' | 'moderate' | 'high' | 'critical'
  risk_level_display: string
  event_description: string
  recorded_by?: string | null
  recorded_by_name: string
  created_at: string
}

export interface RiskEventWritePayload {
  event_date: string
  week_number: number
  risk_level: 'low' | 'moderate' | 'high' | 'critical'
  event_description: string
}

export interface Vaccination {
  id: string
  pregnancy: string
  vaccine_name: string
  status: VaccinationStatus
  status_display: string
  due_week_start?: number | null
  due_week_end?: number | null
  administered_date?: string | null
  administered_by?: string | null
  administered_by_name?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface VaccinationWritePayload {
  vaccine_name: string
  status: VaccinationStatus
  due_week_start?: number | null
  due_week_end?: number | null
  administered_date?: string | null
  administered_by?: string | null
  notes?: string
}

export interface WellnessPlan {
  id: string
  pregnancy: string
  dietary_protocol: string
  dietary_items: string[]
  daily_precautions: string[]
  created_at: string
  updated_at: string
}

export interface WellnessPlanWritePayload {
  dietary_protocol?: string
  dietary_items?: string[]
  daily_precautions?: string[]
}
