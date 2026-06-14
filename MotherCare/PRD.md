# MotherCare — Product Requirements Document (PRD)
## Shakuntala Hospital | Maternity Hospital Management System
**Version:** 1.0 MVP  
**Status:** Approved for Development  
**Last Updated:** 2026-06-06  
**Tech Stack:** Django · PostgreSQL · DRF · React (Frontend)

---

## 1. Project Overview

**MotherCare** is a purpose-built, SaaS-ready Hospital Information System (HIS) for Shakuntala Hospital — a dedicated maternity care facility. It replaces manual registers, fragmented spreadsheets, and paper-based clinical workflows with a unified, role-aware digital platform covering the full maternity journey: from initial patient registration through pregnancy tracking, delivery, newborn care, and discharge.

MotherCare is designed for a single hospital instance (MVP) with a clear upgrade path to multi-branch and patient-facing mobile in Phase 2.

**Brand Tagline:** *Compassionate Care, Advanced Technology*

---

## 2. Goals

### Business Goals
- Eliminate paper-based patient records and manual appointment registers
- Reduce billing errors and revenue leakage through line-item normalised billing
- Provide hospital administration with real-time clinical and financial dashboards
- Ensure medicolegal compliance through immutable prescriptions and append-only audit logs
- Establish a scalable foundation for insurance integration and patient mobile app in Phase 2

### Clinical Goals
- Track every patient from first ANC visit through delivery and newborn care in a single longitudinal record
- Surface allergy and high-risk alerts at prescription and consultation time
- Enable FIFO pharmacy dispensing with batch-level inventory and expiry tracking
- Support multi-baby deliveries (twins, triplets) with individual newborn records
- Provide bed occupancy visibility across General, Private, Labor, NICU, and ICU wards

### Technical Goals
- Achieve full referential integrity at the database layer (FK constraints, DB-enforced business rules)
- Maintain a complete, immutable audit trail for all clinical and financial events
- Support soft-delete across all core clinical entities to preserve historical data
- Deliver a responsive web application accessible on desktops and tablets

---

## 3. Target Users

| User Type | Description |
|---|---|
| Hospital Staff | Primary users of the system — interact via role-specific modules |
| Hospital Administrator | Oversees system configuration, user management, and analytics |
| Patients | Indirect beneficiaries; direct access via mobile app is Phase 2 |

### Personas

**Dr. Anjali Sharma — Obstetrician/Gynecologist**
- Books consultations from appointment list
- Records clinical notes, prescriptions, and follow-up schedules
- Reviews ANC visit history and lab results
- Monitors high-risk pregnancy flags

**Priya (Receptionist)**
- Registers new patients and books appointments
- Assigns tokens and manages daily appointment queue
- Generates bills and collects payments

**James (Head Nurse)**
- Monitors bed occupancy and ward assignments
- Records newborn vitals, feeding logs, and vaccination schedules
- Processes ward transfers and updates admission status

**Rahul (Lab Technician)**
- Views pending lab test queue sorted by urgency (STAT → Urgent → Routine)
- Uploads lab report files (PDF, image, DICOM)
- Flags critical results for immediate doctor review

**Meera (Pharmacist)**
- Fills prescriptions using FIFO batch inventory
- Processes walk-in OTC sales
- Monitors low-stock and near-expiry medicine alerts

**Sarah (HR Director)**
- Manages staff attendance, shift scheduling, and leave requests
- Runs monthly payroll

**System Admin**
- Manages user accounts, roles, and permissions
- Configures hospital profile, localization, and security settings

---

## 4. User Roles

| Role | Primary Modules |
|---|---|
| Doctor | Patients, Appointments, Consultations, Prescriptions, Lab (view), Pregnancy Tracking |
| Nurse | Admissions, Bed Management, Newborn Management, Delivery (record vitals) |
| Receptionist | Patients (register), Appointments (book), Billing (generate/collect) |
| Lab Technician | Laboratory (pending queue, upload reports, flag results) |
| Pharmacist | Pharmacy (inventory, dispense, OTC sales) |
| HR Admin | HR & Staff (attendance, leave, payroll, shift scheduling) |
| System Admin | Settings (users, roles, permissions, hospital config) |
| Financial Officer | Billing & Payments (all bills, payments, revenue dashboard) |
| Chief Medical Officer | Analytics, Reports, Delivery Management, all read access |

---

## 5. Core Modules

| # | Module | Description |
|---|---|---|
| 1 | **Authentication & RBAC** | Login, session management, role-based access control |
| 2 | **Dashboard** | Real-time KPIs: patients, appointments, beds, deliveries, revenue, recent activity |
| 3 | **Patient Management** | Registration, MRN, demographics, allergies, emergency contacts, medical documents |
| 4 | **Pregnancy Tracking** | ANC visits, risk events, vaccination, wellness plan, trimester timeline |
| 5 | **Appointments** | Token-based booking, doctor availability, list/calendar view, status management |
| 6 | **Consultations** | Doctor's notes workspace, prescription entry, lab ordering, follow-up scheduling |
| 7 | **Prescriptions** | Immutable Rx records linked to formulary, previous Rx history per patient |
| 8 | **Laboratory** | Test ordering (STAT/Urgent/Routine), pending queue, report upload, flagged results |
| 9 | **Pharmacy** | Medicine formulary, batch inventory (FIFO), prescription dispensing, OTC sales, alerts |
| 10 | **Admissions** | Intake form, bed assignment, ward transfer history, admission status lifecycle |
| 11 | **Bed Management** | Real-time occupancy across ward types, bed status board |
| 12 | **Delivery Management** | Delivery recording (mode, vitals, complications), procedure logs, live delivery feed |
| 13 | **Newborn Management** | Baby registry, NICU status, vaccinations, feeding logs, vitals tracking, growth charts |
| 14 | **Billing & Payments** | Line-item bills, multiple payment methods, partial payments, billing dashboard |
| 15 | **HR & Staff** | Staff directory, attendance, shift scheduling, leave management, monthly payroll |
| 16 | **Reports & Analytics** | Patient growth, appointment completion, revenue, delivery stats |
| 17 | **Settings** | Hospital profile, user management, role permissions, localization, security, notifications |

---

## 6. Functional Requirements

### 6.1 Authentication & RBAC

| ID | Requirement |
|---|---|
| AUTH-01 | Users authenticate with email/username + password |
| AUTH-02 | Session tokens are hashed (SHA-256); raw tokens never stored |
| AUTH-03 | Per-session revocation with reason logging |
| AUTH-04 | Roles are named groups (Doctor, Nurse, Pharmacist, etc.) |
| AUTH-05 | Permissions are atomic (module + action granularity) |
| AUTH-06 | Users may hold multiple roles |
| AUTH-07 | Remember me and language toggle (English/Marathi) on login page |
| AUTH-08 | 2FA configuration available in Settings (Phase 2 enforcement) |

### 6.2 Patient Management

| ID | Requirement |
|---|---|
| PAT-01 | Each patient is assigned a unique Medical Record Number (MRN) on registration |
| PAT-02 | Patient profile stores: demographics, blood group, contact info, address |
| PAT-03 | Patient allergies are recorded separately with severity levels (mild → life-threatening) |
| PAT-04 | Multiple emergency contacts supported with relationship type and priority order |
| PAT-05 | One patient may have multiple pregnancies (historical record preserved) |
| PAT-06 | Patient records support soft delete; hard DELETE is forbidden |
| PAT-07 | Medical documents (consent, scans, discharge summaries) attach to patient |
| PAT-08 | Allergy alerts surface at prescription entry in the consultation workspace |
| PAT-09 | Patient search by MRN, name (trigram), and phone number |
| PAT-10 | Risk filter on patient roster (Normal / High Risk / 3rd Trimester) |

### 6.3 Pregnancy Tracking

| ID | Requirement |
|---|---|
| PREG-01 | One pregnancy record per pregnancy per patient; LMP and EDD are mandatory |
| PREG-02 | System calculates current gestational week and trimester from LMP |
| PREG-03 | Risk status: normal / high_risk / critical — visible on all patient-facing screens |
| PREG-04 | ANC visits record vitals: BP, weight, FHR, glucose, notes per week |
| PREG-05 | ANC visit timeline visible on pregnancy tracking screen |
| PREG-06 | Risk events are logged longitudinally (e.g., "Week 24 — GDM Detected") |
| PREG-07 | Maternal vaccinations tracked with status: due / administered / not_required / skipped |
| PREG-08 | Wellness plan per pregnancy: dietary protocol, dietary items, daily precautions |
| PREG-09 | Gravida and Para values captured on pregnancy record |
| PREG-10 | Pregnancy supports soft delete |

### 6.4 Appointments

| ID | Requirement |
|---|---|
| APPT-01 | Every consultation must originate from a booked appointment (no walk-in at DB level) |
| APPT-02 | Token numbers are unique per doctor per calendar day |
| APPT-03 | Appointment types: new_patient, follow_up, anc, emergency, scan, lab_review, gdm_screen, ultrasound |
| APPT-04 | Appointment status lifecycle: scheduled → confirmed → in_progress → completed → cancelled / no_show |
| APPT-05 | List view and calendar view available |
| APPT-06 | Doctor availability panel shows next available slot and on-duty/away status |
| APPT-07 | Weekly completion rate KPI displayed on appointment dashboard |
| APPT-08 | Appointments support soft delete |

### 6.5 Consultations

| ID | Requirement |
|---|---|
| CONS-01 | One consultation per appointment (1:1 enforced by UNIQUE FK) |
| CONS-02 | Consultation workspace: doctor's notes, prescription panel, recent lab reports, follow-up scheduler |
| CONS-03 | Previous prescriptions for the patient are displayed (ordered by issued_at DESC) |
| CONS-04 | Allergy and chronic conditions summary visible in the right panel |
| CONS-05 | Consultation status: in_progress → completed / cancelled |
| CONS-06 | Follow-up date and time schedulable within consultation |
| CONS-07 | Consultations support soft delete |

### 6.6 Prescriptions

| ID | Requirement |
|---|---|
| RX-01 | Prescriptions are immutable — no UPDATE or DELETE once issued |
| RX-02 | Each prescription item references a formulary medicine (no free-text drug entry) |
| RX-03 | Prescription items capture: dosage, frequency, duration, instructions, sort order |
| RX-04 | Drug-interaction and allergy alerts raised when medicine matches patient's allergy list |

### 6.7 Laboratory

| ID | Requirement |
|---|---|
| LAB-01 | Lab tests may be ordered from a consultation or independently |
| LAB-02 | Urgency levels: STAT (red), urgent, routine |
| LAB-03 | Test status lifecycle: pending → in_progress → completed / cancelled / critical |
| LAB-04 | Pending queue sorted by urgency, displayed for lab technicians |
| LAB-05 | Lab report files uploaded as PDF, JPG, PNG, or DICOM — one or more per test |
| LAB-06 | Uploaded files are append-only; existing file rows are never overwritten |
| LAB-07 | Key findings and flagged status stored on the lab test record |
| LAB-08 | Flagged results surface as alerts on the dashboard and lab worklist |

### 6.8 Pharmacy

| ID | Requirement |
|---|---|
| PHAR-01 | Medicine formulary is the master list; stock tracked at batch level |
| PHAR-02 | FIFO dispensing: oldest batch by expiry_date and purchase_date is consumed first |
| PHAR-03 | Batch quantity uses SELECT FOR UPDATE before decrement (concurrency safety) |
| PHAR-04 | Reorder level alerts when any medicine's stock falls below threshold |
| PHAR-05 | Near-expiry alerts (configurable window, default 30 days) |
| PHAR-06 | Pharmacy sales may be linked to a prescription or processed as OTC |
| PHAR-07 | Each sale generates an invoice with a unique invoice number |
| PHAR-08 | Sale line items reference specific medicine batches for traceability |
| PHAR-09 | Pending prescriptions queue shown in the pharmacy sidebar |

### 6.9 Admissions & Beds

| ID | Requirement |
|---|---|
| ADM-01 | Admission intake: patient search, assigned doctor, admission type, room/bed selection, reason, EDD |
| ADM-02 | Admission types: maternity, post_natal, emergency, surgery |
| ADM-03 | Admission status: active → discharge_pending → discharged / transferred / deceased |
| ADM-04 | One patient may not occupy two beds simultaneously (enforced at application layer) |
| ADM-05 | Ward transfers logged with from_bed, to_bed, reason, and transferring user |
| ADM-06 | Bed status board shows real-time occupancy across ward types (General, Private, Labor, NICU, ICU) |
| ADM-07 | Bed statuses: available / occupied / cleaning / maintenance / reserved |
| ADM-08 | Emergency Admission shortcut button available on bed management screen |
| ADM-09 | Admissions support soft delete |

### 6.10 Delivery Management

| ID | Requirement |
|---|---|
| DEL-01 | Delivery record must be linked to an existing Admission (NOT NULL FK enforced) |
| DEL-02 | One delivery per admission (UNIQUE FK) |
| DEL-03 | Delivery modes: normal, c_section, assisted, water_birth |
| DEL-04 | Delivery record captures: datetime, blood loss, placenta completeness, complications, notes |
| DEL-05 | Delivery procedures logged separately (C-section, episiotomy, etc.) with performing doctor |
| DEL-06 | Live delivery feed on the delivery management dashboard (real-time) |
| DEL-07 | High-risk delivery flag visible on the dashboard KPI strip |
| DEL-08 | Deliveries support soft delete |

### 6.11 Newborn Management

| ID | Requirement |
|---|---|
| NB-01 | Multiple newborns per delivery (twins/triplets supported) |
| NB-02 | Each baby assigned a unique Baby MRN |
| NB-03 | Birth record: weight, length, APGAR (1 min and 5 min, validated 0–10), gender, condition |
| NB-04 | Newborn conditions: healthy / nicu_required / deceased / transferred |
| NB-05 | NICU flag triggers NICU bed assignment workflow |
| NB-06 | Newborn vaccinations tracked independently from maternal vaccinations |
| NB-07 | Feeding logs: breast / formula / NG tube / IV — with timestamp and volume |
| NB-08 | Periodic vitals: weight, head circumference, temperature |
| NB-09 | Growth trend chart displayed on newborn profile |
| NB-10 | Export Medical Record action available on newborn screen |
| NB-11 | Newborns support soft delete |

### 6.12 Billing & Payments

| ID | Requirement |
|---|---|
| BILL-01 | Bills are line-item normalised via BillItem table (no untyped reference_id) |
| BILL-02 | Bill types: consultation, lab, pharmacy, admission, misc |
| BILL-03 | Payment status: pending / partial / paid / overdue / refunded |
| BILL-04 | Multiple payments per bill supported (partial payment workflow) |
| BILL-05 | Payment methods: cash, card, UPI, netbanking, insurance, cheque |
| BILL-06 | Quick billing shortcuts: Consultation / Laboratory / Pharmacy / Admission |
| BILL-07 | Invoice PDF generation |
| BILL-08 | Revenue dashboard: today's revenue, pending payments, paid invoices count |
| BILL-09 | amount_paid must never exceed total_amount (DB CHECK constraint) |

### 6.13 HR & Staff

| ID | Requirement |
|---|---|
| HR-01 | Staff directory with department, role, and active/on-leave status |
| HR-02 | Daily attendance: present / absent / half_day / on_leave / holiday |
| HR-03 | Shift scheduling: morning / afternoon / night / on_call |
| HR-04 | Leave requests with approval workflow (pending → approved / rejected / cancelled) |
| HR-05 | Leave types: casual, sick, maternity, earned, unpaid |
| HR-06 | Monthly payroll: basic + allowances − deductions = net_pay (DB computed column) |
| HR-07 | Payroll status: pending / paid / on_hold |

### 6.14 Emergency & Notifications

| ID | Requirement |
|---|---|
| EMRG-01 | Emergency alerts linked to patient, responsible doctor, and active admission |
| EMRG-02 | Alert status: triggered → acknowledged → resolved |
| EMRG-03 | Response time in seconds recorded on acknowledgement |
| EMRG-04 | Emergency Delivery Alert visible in dashboard Recent Activity feed |
| NOTIF-01 | Notification channels: email, SMS, WhatsApp, push |
| NOTIF-02 | At least one recipient (user or patient) required per notification record |
| NOTIF-03 | Notification status: pending / sent / delivered / failed |

---

## 7. Non-Functional Requirements

### 7.1 Performance
- Dashboard KPIs load within **2 seconds** under normal hospital load
- Patient search (trigram) returns results within **500ms**
- Lab pending queue refreshes within **1 second** of a new test order

### 7.2 Security
- Passwords stored as Argon2id hashes; session tokens stored as SHA-256 hashes
- All API endpoints require a valid session token
- RBAC enforced at the API layer — no client-side permission gating only
- Audit log captures all create, update, delete, login, logout, upload, and download events
- Audit log is immutable (INSERT only; partitioned monthly before production)
- 2FA configurable via Settings (enforced in Phase 2)

### 7.3 Data Integrity
- All 49 MVP tables carry created_at, updated_at, created_by audit fields
- Soft delete on 7 clinical entities: patient, pregnancy, appointment, consultation, admission, delivery, newborn
- Hard DELETE forbidden on all soft-delete tables and all immutable tables
- Prescriptions and lab report files are append-only
- Medicine batch quantity protected by SELECT FOR UPDATE during concurrent dispensing

### 7.4 Availability & Reliability
- Target uptime: **99.5%** during business hours
- Database: PostgreSQL with connection pooling
- Planned backup frequency: daily (configurable in Settings > Security & Backup)

### 7.5 Localization
- Default language: English (UK)
- Secondary language: Marathi (switchable on login screen and Settings)
- Timezone and locale configurable per hospital instance

### 7.6 Compliance
- Complete audit trail maintained for medicolegal compliance
- Consent documents stored as MedicalDocument records
- Prescription immutability satisfies pharmacy regulatory requirements

### 7.7 Scalability
- Single hospital instance for MVP
- Schema designed for multi-tenant upgrade (hospital master table, tenant_id column addition)
- Phase 2 entities documented and excluded from MVP migrations

---

## 8. MVP Scope

### In Scope (49 tables across 18 domains)

| Domain | Entities |
|---|---|
| Authentication & RBAC | User, Role, Permission, UserRole, RolePermission, UserSession |
| Hospital Configuration | Hospital, Department |
| People | Patient, EmergencyContact, PatientEmergencyContact, PatientAllergy, Staff, Doctor |
| Pregnancy | Pregnancy, AncVisit, PregnancyRiskEvent, Vaccination, WellnessPlan |
| Appointments | Appointment |
| Consultations | Consultation |
| Prescriptions | Prescription, PrescriptionItem |
| Laboratory | LabTest, LabReportFile |
| Pharmacy | Medicine, MedicineBatch, PharmacySale, PharmacySaleItem |
| Beds & Admissions | Bed, Admission, WardTransfer |
| Delivery | Delivery, DeliveryProcedure |
| Newborn | Newborn, NewbornVaccination, NewbornFeedingLog, NewbornVital |
| Billing | Bill, BillItem, BillPayment |
| HR & Payroll | Attendance, ShiftSchedule, LeaveRequest, Salary |
| Emergency SOS | EmergencyAlert |
| Notifications | Notification |
| Medical Documents | MedicalDocument |
| Audit Logs | AuditLog |

### UI Modules in MVP
Dashboard · Patients · Pregnancy Tracking · Appointments · Consultations · Prescriptions · Laboratory · Pharmacy · Admissions · Bed Management · Delivery Management · Newborn Management · Billing & Payments · HR & Staff · Reports · Settings

---

## 9. Future Scope (Phase 2)

| Feature | Entity / Module |
|---|---|
| Patient mobile app (mothers) | PatientLogin, DeviceToken |
| Insurance claims workflow | InsuranceClaim, InsuranceProvider, InsurancePolicy |
| External & internal referrals | Referral |
| Structured diet orders (GDM) | DietOrder |
| Operation theatre scheduling | OTBooking, OperationTheatre |
| NICU as trackable sub-admission | NicuAdmission (replaces nicu_required flag) |
| Labour progress charting | Partograph |
| Medicolegal consent records | ConsentRecord |
| Continuous labour vitals | AdmissionVital |
| Care team assignment per delivery | CareTeamMember |
| Pharmacy procurement audit | Supplier, PurchaseOrder |
| Multi-branch support | Multi-tenant hospital schema |
| Advanced analytics | Custom reports, export to Excel/PDF |

---

*MotherCare PRD v1.0 — Shakuntala Hospital — Maternity Hospital Management System*
