import type { AuditFields, SoftDeleteFields } from './common.types'

export type DeliveryMode = 'normal' | 'c_section' | 'assisted' | 'water_birth';

export interface DeliveryProcedure {
  id: string;
  delivery: string;
  performed_by: string;
  performed_by_name: string;
  procedure_name: string;
  indication: string;
  technique: string;
  implants_used: string;
  duration_minutes: number;
  post_op_instructions: string;
  performed_at: string;
  created_at: string;
}

export interface DeliveryProcedureWritePayload {
  performed_by: string;
  procedure_name: string;
  indication?: string;
  technique?: string;
  implants_used?: string;
  duration_minutes?: number;
  post_op_instructions?: string;
  performed_at?: string;
}

export interface Delivery extends AuditFields, SoftDeleteFields {
  id: string;
  admission: string;
  patient: string;
  patient_name: string;
  patient_mrn: string;
  doctor: string;
  doctor_name: string;
  delivery_datetime: string;
  delivery_mode: DeliveryMode;
  delivery_mode_display: string;
  blood_loss_ml: number | null;
  placenta_complete: boolean;
  complications: string;
  notes: string;
  procedures: DeliveryProcedure[];
}

export interface DeliveryWritePayload {
  admission: string;
  patient: string;
  doctor: string;
  delivery_datetime: string;
  delivery_mode: DeliveryMode;
  blood_loss_ml?: number | null;
  placenta_complete?: boolean;
  complications?: string;
  notes?: string;
  procedures?: DeliveryProcedureWritePayload[];
}
