import type { AuditFields, SoftDeleteFields } from './common.types'

export type NewbornGender = 'M' | 'F' | 'O' | 'U';
export type NewbornCondition = 'healthy' | 'nicu_required' | 'deceased' | 'transferred';
export type FeedType = 'breast' | 'formula' | 'ng_tube' | 'iv';
export type VaccineStatus = 'due' | 'administered' | 'not_required' | 'skipped';

export interface NewbornVital {
  id: string;
  newborn: string;
  recorded_at: string;
  weight_kg: number;
  head_circ_cm: number | null;
  temperature: number | null;
  notes: string;
  recorded_by: string | null;
  recorded_by_name: string;
  created_at: string;
}

export interface NewbornFeedingLog {
  id: string;
  newborn: string;
  feed_type: FeedType;
  feed_type_display: string;
  feed_time: string;
  volume_ml: number | null;
  notes: string;
  created_at: string;
}

export interface NewbornVaccination {
  id: string;
  newborn: string;
  vaccine_name: string;
  dose_number: number;
  status: VaccineStatus;
  status_display: string;
  administered_date: string | null;
  notes: string;
  created_at: string;
}

export interface Newborn extends AuditFields, SoftDeleteFields {
  id: string;
  delivery: string;
  baby_mrn: string;
  gender: NewbornGender;
  gender_display: string;
  birth_weight_kg: number;
  birth_length_cm: number | null;
  apgar_1min: number;
  apgar_5min: number;
  condition: NewbornCondition;
  condition_display: string;
  nicu_required: boolean;
  mother_name: string;
  mother_mrn: string;
  notes: string;
  vaccinations?: NewbornVaccination[];
  feeding_logs?: NewbornFeedingLog[];
  vitals?: NewbornVital[];
}

export interface NewbornWritePayload {
  delivery: string;
  gender: NewbornGender;
  birth_weight_kg: number;
  birth_length_cm?: number | null;
  apgar_1min: number;
  apgar_5min: number;
  condition?: NewbornCondition;
  nicu_required?: boolean;
  notes?: string;
}

export interface NewbornVitalWritePayload {
  weight_kg: number;
  head_circ_cm?: number | null;
  temperature?: number | null;
  recorded_at?: string;
  notes?: string;
}

export interface NewbornFeedingWritePayload {
  feed_type: FeedType;
  feed_time?: string;
  volume_ml?: number | null;
  notes?: string;
}

export interface NewbornVaccinationUpdatePayload {
  vaccination_id: string;
  status: VaccineStatus;
  administered_date?: string | null;
  notes?: string;
}
