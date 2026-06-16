import type { AuditFields } from './common.types'

export type LabUrgency = 'stat' | 'urgent' | 'routine';
export type LabStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'critical';
export type FileType = 'pdf' | 'jpg' | 'png' | 'dicom';

export interface LabReportFile {
  id: string;
  lab_test: string;
  file_url: string;
  file_type: FileType;
  file_type_display: string;
  uploaded_at: string;
  uploaded_by: string;
  notes: string;
}

export interface LabTest extends AuditFields {
  id: string;
  patient: string;
  patient_name: string;
  patient_mrn: string;
  ordered_by: string;
  doctor_name: string;
  consultation: string | null;
  test_type: string;
  test_type_display: string;
  urgency: LabUrgency;
  urgency_display: string;
  status: LabStatus;
  status_display: string;
  requested_at: string;
  completed_at: string | null;
  key_findings: string;
  flagged: boolean;
  is_terminal: boolean;
  is_critical: boolean;
  report_files: LabReportFile[];
}

export interface LabTestWritePayload {
  patient: string;
  ordered_by: string;
  consultation?: string | null;
  test_type: string;
  urgency: LabUrgency;
  notes?: string;
}

export interface LabStatusUpdatePayload {
  new_status: LabStatus;
  key_findings?: string;
}

export interface LabReportUploadPayload {
  file: File;
  notes?: string;
}
