/**
 * MotherCare Common TypeScript Types
 * Mirror backend model fields for type safety across all API calls.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Common / Shared
// ─────────────────────────────────────────────────────────────────────────────
export type UUID = string;

export interface AuditFields {
  created_at: string;  // ISO 8601 UTC
  updated_at: string;
  created_by: UUID | null;
}

export interface SoftDeleteFields {
  is_deleted: boolean;
  deleted_at: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail: string;
  code: string;
  field?: string;
  errors?: Record<string, string[]>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: UUID;
  username: string;
  email: string;
  is_active: boolean;
  roles: string[];
  permissions: string[];  // "module:action" format
  patient_profile_id?: string | null;
  last_login: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  token: string;   // Raw token (displayed once, SHA-256 hash stored server-side)
  user: AuthUser;
  expires_at: string;
}

export interface UserSession {
  id: UUID;
  ip_address: string | null;
  user_agent: string;
  issued_at: string;
  expires_at: string;
  revoked_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Risk & Status Enums
// ─────────────────────────────────────────────────────────────────────────────
export type RiskStatus = 'normal' | 'high_risk' | 'critical';
export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentType = 'new_patient' | 'follow_up' | 'anc' | 'emergency' | 'scan' | 'lab_review' | 'gdm_screen' | 'ultrasound';
export type ConsultationStatus = 'in_progress' | 'completed' | 'cancelled';
export type LabUrgency = 'stat' | 'urgent' | 'routine';
export type LabStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'critical';
export type BedStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved';
export type WardType = 'general' | 'private' | 'labor' | 'nicu' | 'icu';
export type AdmissionStatus = 'active' | 'discharge_pending' | 'discharged' | 'transferred' | 'deceased';
export type AdmissionType = 'maternity' | 'post_natal' | 'emergency' | 'surgery';
export type DeliveryMode = 'normal' | 'c_section' | 'assisted' | 'water_birth';
export type NewbornCondition = 'healthy' | 'nicu_required' | 'deceased' | 'transferred';
export type BillType = 'consultation' | 'lab' | 'pharmacy' | 'admission' | 'misc';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'netbanking' | 'insurance' | 'cheque';
export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'push';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed';
export type EmergencyAlertStatus = 'triggered' | 'acknowledged' | 'resolved';
export type VaccinationStatus = 'due' | 'administered' | 'not_required' | 'skipped';
export type FeedType = 'breast' | 'formula' | 'ng_tube' | 'iv';
export type LeaveType = 'casual' | 'sick' | 'maternity' | 'earned' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ShiftType = 'morning' | 'afternoon' | 'night' | 'on_call';
export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'on_leave' | 'holiday';
export type PayrollStatus = 'pending' | 'paid' | 'on_hold';
