# MotherCare – Final Database Architecture
## Shakuntala Hospital | Maternity Hospital Management System
### Version: 2.0 MVP FINAL
### Tech Stack: Django · PostgreSQL · DRF
### Source of Truth: UI (stitch_new_project) + Business Rules + Approved Change Set v2

---

## CHANGELOG — v1.0 → v2.0

| # | Change | Action | Impact |
|---|---|---|---|
| 1 | Remove PreviousPrescriptionNote | Entity deleted | Domain 6 simplified; previous Rx served by querying Prescription table directly |
| 2 | Replace single EmergencyContact FK with PatientEmergencyContact junction | Entity added, old FK removed | Patient now supports multiple contacts with priority + relationship_type |
| 3 | Replace Bill.reference_id with BillItem table | Entity added, untyped UUID column removed | Billing is now fully line-item normalised; referential integrity enforceable |
| 4 | Add soft delete fields to 6 clinical tables | Fields added: is_deleted, deleted_at | Patient, Pregnancy, Appointment, Consultation, Admission, Delivery, Newborn |
| 5 | Add audit fields to all major entities | Fields added: created_at, updated_at, created_by | Applied to all 40 MVP tables |
| 6 | Move 8 entities to Phase 2 documentation only | Entities excluded from MVP schema | InsuranceClaim, PatientLogin, DeviceToken, Referral, DietOrder, OTBooking, NicuAdmission, Partograph |

---

## PART 1 — DOMAIN-WISE ENTITIES (MVP v2.0)

### DOMAIN 1 — Authentication & RBAC

**User**
System login account for all hospital staff.
Fields: id, username, email, password_hash, is_active, last_login
Audit: created_at, updated_at, created_by

**Role**
Named permission group. Examples: Doctor, Nurse, Pharmacist, Receptionist, Lab Tech, HR Admin, System Admin.
Fields: id, name, description
Audit: created_at, updated_at, created_by

**Permission**
Atomic access grant at module + action granularity.
Fields: id, name, module, action, description
Constraints: UNIQUE(module, action)
Audit: created_at, updated_at, created_by

**UserRole** (junction)
Many-to-many: User ↔ Role.
Fields: id, user_id → user, role_id → role
Constraints: UNIQUE(user_id, role_id)
Audit: created_at, created_by

**RolePermission** (junction)
Many-to-many: Role ↔ Permission.
Fields: id, role_id → role, permission_id → permission
Constraints: UNIQUE(role_id, permission_id)
Audit: created_at, created_by

**UserSession**
One active session token per login event. Enables per-session revocation.
Fields: id, user_id → user, token_hash (SHA-256, not raw token), ip_address, user_agent, issued_at, expires_at, revoked_at, revoke_reason
Constraints: CHECK(expires_at > issued_at)
Audit: created_at, created_by

---

### DOMAIN 2 — Hospital Configuration

**Hospital**
Single-row institutional master. Holds name, code, address, timezone, locale.
Fields: id, name, code, address, city, state, pincode, phone, email, timezone, locale, logo_url
Audit: created_at, updated_at, created_by

**Department**
Clinical and administrative departments.
Fields: id, name, department_type, head_staff_id → staff (nullable), is_active
Values: Obstetrics, Pediatrics, Nursing, Admin, Laboratory, Pharmacy, ICU, HR
Audit: created_at, updated_at, created_by

---

### DOMAIN 3 — People

**Patient**
Core demographic record. One row per person, regardless of how many pregnancies.
Fields: id, mrn, full_name, dob, blood_group, phone, alt_phone, email, address, is_active
Soft delete: is_deleted, deleted_at
Audit: created_at, updated_at, created_by
Constraints: UNIQUE(mrn)

**EmergencyContact**
Reusable contact record. Not tied 1:1 to any patient — shared via junction.
Fields: id, name, phone, alt_phone, email
Audit: created_at, updated_at, created_by

**PatientEmergencyContact** (junction) ← CHANGE 2: replaces single FK on Patient
Links one Patient to multiple EmergencyContacts.
Fields:
  id
  patient_id         → patient (CASCADE)
  contact_id         → emergency_contact (CASCADE)
  relationship_type  VARCHAR — values: spouse, parent, sibling, child, guardian, friend, other
  priority           SMALLINT — 1 = primary, 2 = secondary, etc.
  is_primary         BOOLEAN  — denormalised convenience flag; true for priority = 1
Constraints: UNIQUE(patient_id, contact_id)
             CHECK(priority > 0)
Audit: created_at, updated_at, created_by

**PatientAllergy**
Allergies are linked to Patient (not Pregnancy) so they persist across all pregnancies
and are surfaced at prescription time as a critical alert.
Fields: id, patient_id → patient (CASCADE), allergen, reaction_type, severity, recorded_date, recorded_by → user (SET NULL), notes
Enum — severity: mild, moderate, severe, life_threatening
Audit: created_at, updated_at, created_by

**Staff**
All hospital employees. Links to User for system access.
Fields: id, user_id → user (SET NULL, UNIQUE), department_id → department (SET NULL), full_name, designation, phone, email, join_date, is_active
Audit: created_at, updated_at, created_by

**Doctor**
Clinical sub-type of Staff. Holds credentials.
Fields: id, staff_id → staff (CASCADE, UNIQUE), specialisation, registration_no, available_from (TIME), available_to (TIME)
Constraints: UNIQUE(registration_no)
Audit: created_at, updated_at, created_by

---

### DOMAIN 4 — Pregnancy

**Pregnancy**
One record per pregnancy per patient. Multiple pregnancies supported.
Fields: id, patient_id → patient (RESTRICT), assigned_doctor_id → doctor (RESTRICT),
        lmp, edd, current_week, trimester, risk_status, gravida, para, chronic_conditions, is_active
Soft delete: is_deleted, deleted_at
Enum — risk_status: normal, high_risk, critical
Constraints: CHECK(edd > lmp), CHECK(current_week BETWEEN 1 AND 45), CHECK(trimester IN (1,2,3))
Audit: created_at, updated_at, created_by

**AncVisit**
One row per antenatal care visit. Vitals stored as typed numeric columns for range queries.
Fields: id, pregnancy_id → pregnancy (RESTRICT), doctor_id → doctor (RESTRICT),
        visit_date, week_at_visit, visit_type,
        bp_systolic, bp_diastolic, weight_kg, fhr_bpm, glucose_mgdl, notes
Audit: created_at, updated_at, created_by

**PregnancyRiskEvent**
Longitudinal risk milestone log (e.g. "Week 24 — GDM Detected"). Feeds the risk timeline UI.
Fields: id, pregnancy_id → pregnancy (CASCADE), week_number, risk_level, event_description, recorded_by → user (SET NULL), event_date
Audit: created_at, updated_at, created_by

**Vaccination** (maternal)
Tracks vaccines for the mother during pregnancy. Not to be confused with NewbornVaccination.
Fields: id, pregnancy_id → pregnancy (CASCADE), vaccine_name, status, due_week_start, due_week_end, administered_date, administered_by → doctor (SET NULL), notes
Enum — status: due, administered, not_required, skipped
Audit: created_at, updated_at, created_by

**WellnessPlan**
Dietary and daily precaution guidelines. One plan per pregnancy (1:1).
Fields: id, pregnancy_id → pregnancy (CASCADE, UNIQUE), dietary_protocol, dietary_items (JSONB array of strings), daily_precautions (JSONB array of strings)
Audit: created_at, updated_at, created_by

---

### DOMAIN 5 — Appointments

**Appointment**
Every consultation must originate from a booked appointment. No walk-ins at DB level.
Fields: id, patient_id → patient (RESTRICT), doctor_id → doctor (RESTRICT),
        appointment_datetime, appointment_type, token_number, status, notes, booked_by → user (SET NULL)
Soft delete: is_deleted, deleted_at
Enum — appointment_type: new_patient, follow_up, anc, emergency, scan, lab_review, gdm_screen, ultrasound
Enum — status: scheduled, confirmed, in_progress, completed, cancelled, no_show
Constraints: UNIQUE(doctor_id, appointment_datetime::date, token_number)
Audit: created_at, updated_at, created_by

---

### DOMAIN 6 — Consultations

**Consultation**
One consultation per appointment. Clinical notes workspace for the doctor.
The "Previous Prescriptions" UI panel is served by querying the Prescription table
directly (patient_id filter, ordered by issued_at DESC) — no separate entity needed.
Fields: id, appointment_id → appointment (RESTRICT, UNIQUE), patient_id → patient (RESTRICT),
        doctor_id → doctor (RESTRICT), start_time, end_time, status, clinical_notes, follow_up_datetime
Soft delete: is_deleted, deleted_at
Enum — status: in_progress, completed, cancelled
Constraints: CHECK(end_time IS NULL OR end_time > start_time)
Audit: created_at, updated_at, created_by

NOTE — PreviousPrescriptionNote removed (Change 1).
Previous prescriptions are fetched with:
  Prescription WHERE patient_id = ? ORDER BY issued_at DESC
No junction table is needed or appropriate.

---

### DOMAIN 7 — Prescriptions

**Prescription**
Immutable header record per consultation. Append-only — never update, never delete.
Fields: id, consultation_id → consultation (RESTRICT), patient_id → patient (RESTRICT), issued_at, notes
Audit: created_at, updated_at, created_by
Rule: No UPDATE or DELETE permitted on this table.

**PrescriptionItem**
Line items for each prescription. References Medicine by FK — no free text.
This enables drug-interaction alerts, formulary compliance, and dispensing reconciliation.
Fields: id, prescription_id → prescription (CASCADE), medicine_id → medicine (RESTRICT),
        dosage, frequency, duration, instructions, sort_order
Audit: created_at, updated_at, created_by
Rule: Inherit immutability from parent Prescription.

---

### DOMAIN 8 — Laboratory

**LabTest**
Test order record. May or may not originate from a consultation.
Fields: id, patient_id → patient (RESTRICT), consultation_id → consultation (RESTRICT, nullable),
        ordered_by → doctor (RESTRICT), test_type, requested_at, urgency, status, key_findings, flagged, completed_at
Enum — urgency: stat, urgent, routine
Enum — status: pending, in_progress, completed, cancelled, critical
Audit: created_at, updated_at, created_by

**LabReportFile**
One or more file uploads per test. Append-only — never overwrite old files.
Fields: id, lab_test_id → lab_test (CASCADE), uploaded_by → user (RESTRICT),
        file_url, file_type, uploaded_at
Enum — file_type: pdf, jpg, png, dicom
Audit: created_at, created_by
Rule: New row per upload. No UPDATE or DELETE on existing file rows.

---

### DOMAIN 9 — Pharmacy

**Medicine**
Master formulary. One row per drug product. Stock tracked at batch level, not here.
Fields: id, name, generic_name, category, unit, reorder_level, is_active
Constraints: UNIQUE(name, category)
Audit: created_at, updated_at, created_by

**MedicineBatch**
Batch-level inventory. Quantity lives here, not on Medicine.
FIFO dispensing = ORDER BY expiry_date ASC, purchase_date ASC.
Fields: id, medicine_id → medicine (RESTRICT), batch_number, supplier_name,
        purchase_date, expiry_date, quantity (≥ 0), purchase_price, selling_price
Constraints: UNIQUE(medicine_id, batch_number), CHECK(expiry_date > purchase_date), CHECK(quantity >= 0)
Audit: created_at, updated_at, created_by
Rule: Use SELECT FOR UPDATE on batch row before decrementing quantity (concurrency safety).

**PharmacySale**
Invoice header for a pharmacy transaction. May be linked to a prescription or walk-in OTC sale.
Fields: id, prescription_id → prescription (SET NULL, nullable), patient_id → patient (RESTRICT),
        sold_by → user (RESTRICT), invoice_number, total_amount, sold_at
Constraints: UNIQUE(invoice_number)
Audit: created_at, updated_at, created_by

**PharmacySaleItem**
Line items per sale. Each row deducts from a specific MedicineBatch for traceability.
Fields: id, sale_id → pharmacy_sale (CASCADE), medicine_batch_id → medicine_batch (RESTRICT),
        qty (> 0), unit_price, line_total (GENERATED ALWAYS AS qty * unit_price STORED)
Audit: created_at, created_by

---

### DOMAIN 10 — Beds & Admissions

**Bed**
Physical bed master. Status is the real-time state of the bed, not the patient.
Fields: id, bed_number, ward_type, status, floor, last_cleaned_at, notes
Enum — ward_type: general, private, labor, nicu, icu
Enum — status: available, occupied, cleaning, maintenance, reserved
Constraints: UNIQUE(bed_number)
Audit: created_at, updated_at, created_by

**Admission**
Patient inpatient record. Status reflects clinical state of the admission.
Fields: id, patient_id → patient (RESTRICT), bed_id → bed (RESTRICT),
        doctor_id → doctor (RESTRICT), status, admission_type, admitted_at,
        est_discharge, actual_discharge, notes
Soft delete: is_deleted, deleted_at
Enum — admission_status: active, discharge_pending, discharged, transferred, deceased
Enum — admission_type: maternity, post_natal, emergency, surgery
Constraints: CHECK(actual_discharge IS NULL OR actual_discharge > admitted_at)
Audit: created_at, updated_at, created_by

**WardTransfer**
Full movement history of a patient across beds within a single admission.
Fields: id, admission_id → admission (CASCADE), from_bed_id → bed (SET NULL),
        to_bed_id → bed (RESTRICT), transferred_at, reason, transferred_by → user (SET NULL)
Audit: created_at, created_by

---

### DOMAIN 11 — Delivery

**Delivery**
One delivery record per admission. Linked to Admission via UNIQUE FK.
Fields: id, admission_id → admission (RESTRICT, UNIQUE), patient_id → patient (RESTRICT),
        doctor_id → doctor (RESTRICT), delivery_datetime, delivery_mode,
        blood_loss_ml, placenta_complete, complications, notes
Soft delete: is_deleted, deleted_at
Enum — delivery_mode: normal, c_section, assisted, water_birth
Audit: created_at, updated_at, created_by
Rule: Delivery record must be linked to an existing Admission. Enforced by NOT NULL FK.

**DeliveryProcedure**
Structured procedure log per delivery. Replaces free-text notes for C-sections,
episiotomies, instrumental deliveries, and post-partum procedures.
Fields: id, delivery_id → delivery (RESTRICT), performed_by → doctor (RESTRICT),
        procedure_name, indication, technique, implants_used,
        duration_minutes, post_op_instructions, performed_at
Audit: created_at, updated_at, created_by

---

### DOMAIN 12 — Newborn

**Newborn**
One row per baby. Multiple rows per delivery support twins and triplets.
Mother reached via: Newborn → Delivery → Admission → Patient (no redundant mother_id).
Fields: id, delivery_id → delivery (RESTRICT), baby_mrn, gender,
        birth_weight_kg, birth_length_cm, apgar_1min, apgar_5min,
        condition, nicu_required, notes
Soft delete: is_deleted, deleted_at
Enum — condition: healthy, nicu_required, deceased, transferred
Constraints: UNIQUE(baby_mrn), CHECK(apgar_1min BETWEEN 0 AND 10), CHECK(apgar_5min BETWEEN 0 AND 10)
Audit: created_at, updated_at, created_by

**NewbornVaccination**
Vaccination records for the newborn. Distinct from maternal Vaccination.
Fields: id, newborn_id → newborn (CASCADE), vaccine_name, dose_number, status, administered_date, notes
Audit: created_at, updated_at, created_by

**NewbornFeedingLog**
Time-stamped feeding records per newborn. Supports breastfeed and formula tracking.
Fields: id, newborn_id → newborn (CASCADE), feed_type, feed_time, volume_ml, notes
Enum — feed_type: breast, formula, ng_tube, iv
Audit: created_at, created_by

**NewbornVital**
Periodic vital recordings for newborn monitoring and growth tracking.
Fields: id, newborn_id → newborn (CASCADE), recorded_at, weight_kg, head_circ_cm, temperature, notes, recorded_by → user (SET NULL)
Audit: created_at, created_by

---

### DOMAIN 13 — Billing

**Bill**
Header record per billing event. One patient may have multiple bills of different types.
Fields: id, patient_id → patient (RESTRICT), bill_type, admission_id → admission (SET NULL, nullable),
        total_amount, amount_paid, payment_status, notes, generated_at
Enum — bill_type: consultation, lab, pharmacy, admission, misc
Enum — payment_status: pending, partial, paid, overdue, refunded
Constraints: CHECK(amount_paid >= 0), CHECK(total_amount >= 0), CHECK(amount_paid <= total_amount)
Audit: created_at, updated_at, created_by

NOTE — Bill.reference_id (untyped UUID) REMOVED (Change 3).
Replaced by BillItem table below.

**BillItem** ← CHANGE 3: new entity replacing untyped reference_id
Line items that make up a bill. Fully typed and normalised. Supports mixed bills.
Fields:
  id
  bill_id            → bill (CASCADE)
  item_type          ENUM: consultation_charge, lab_charge, pharmacy_charge,
                           admission_charge, procedure_charge, misc_charge
  item_name          VARCHAR(120)    — human-readable label, e.g. "CBC Blood Test", "Ward Charges – Day 2"
  reference_id       UUID (nullable) — optional FK to the source row (consultation.id, lab_test.id, etc.)
                                       nullable because misc charges may have no source entity
  quantity           NUMERIC(8,2)    — supports fractional units (e.g. 2.5 days of ward charges)
  unit_price         NUMERIC(10,2)
  total_price        NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
  sort_order         SMALLINT DEFAULT 0
Constraints: CHECK(quantity > 0), CHECK(unit_price >= 0)
Audit: created_at, updated_at, created_by

BillItem.reference_id is a soft reference (no DB-level FK) to the source entity.
bill_type on the parent Bill tells the application which table to join.
This preserves flexibility for misc charges while allowing typed joins for auditable items.

**BillPayment**
Records each payment transaction against a bill. Supports partial payments.
Fields: id, bill_id → bill (RESTRICT), amount, payment_method, transaction_ref, paid_at, recorded_by → user (SET NULL)
Enum — payment_method: cash, card, upi, netbanking, insurance, cheque
Constraints: CHECK(amount > 0)
Audit: created_at, created_by

---

### DOMAIN 14 — HR & Payroll

**Attendance**
Manual daily attendance record per staff member.
Fields: id, staff_id → staff (RESTRICT), attendance_date, check_in (TIME), check_out (TIME), status, notes
Enum — status: present, absent, half_day, on_leave, holiday
Constraints: UNIQUE(staff_id, attendance_date)
Audit: created_at, updated_at, created_by

**ShiftSchedule**
Shift rosters and on-call assignments.
Fields: id, staff_id → staff (CASCADE), shift_date, shift_type, start_time (TIME), end_time (TIME), ward, notes
Enum — shift_type: morning, afternoon, night, on_call
Constraints: UNIQUE(staff_id, shift_date, shift_type)
Audit: created_at, updated_at, created_by

**LeaveRequest**
Leave application and approval workflow.
Fields: id, staff_id → staff (CASCADE), from_date, to_date, leave_type, status, reason, approved_by → staff (SET NULL), approved_at
Enum — leave_type: casual, sick, maternity, earned, unpaid
Enum — status: pending, approved, rejected, cancelled
Constraints: CHECK(to_date >= from_date)
Audit: created_at, updated_at, created_by

**Salary**
Monthly payroll record per staff member.
Fields: id, staff_id → staff (RESTRICT), month (1–12), year (≥ 2020), basic, allowances, deductions,
        net_pay (GENERATED ALWAYS AS basic + allowances - deductions STORED), payment_status, paid_at, notes
Enum — payment_status: pending, paid, on_hold
Constraints: UNIQUE(staff_id, month, year), CHECK(month BETWEEN 1 AND 12)
Audit: created_at, updated_at, created_by

---

### DOMAIN 15 — Emergency SOS

**EmergencyAlert**
Triggered by ward staff or system. Links to the patient, responsible doctor, and optionally the active admission.
Fields: id, patient_id → patient (RESTRICT), doctor_id → doctor (RESTRICT),
        admission_id → admission (SET NULL, nullable), triggered_at, status,
        response_time_sec, acknowledged_by → user (SET NULL), acknowledged_at, notes
Enum — status: triggered, acknowledged, resolved
Audit: created_at, updated_at, created_by

---

### DOMAIN 16 — Notifications

**Notification**
Outbound notification history for all channels. At least one recipient required.
Fields: id, recipient_user_id → user (SET NULL, nullable), recipient_patient_id → patient (SET NULL, nullable),
        notification_type, channel, title, message, status, sent_at, error_message
Enum — channel: email, sms, whatsapp, push
Enum — status: pending, sent, delivered, failed
Constraints: CHECK(recipient_user_id IS NOT NULL OR recipient_patient_id IS NOT NULL)
Audit: created_at, created_by

---

### DOMAIN 17 — Medical Documents

**MedicalDocument**
Centralised document store per patient. Covers all file types: consent PDFs, discharge
summaries, ultrasound scans, referral letters, prescriptions, lab reports.
Fields: id, patient_id → patient (RESTRICT), uploaded_by → user (RESTRICT),
        document_type, file_url, file_type, description, uploaded_at
Enum — document_type: consent, discharge_summary, scan, referral, insurance, prescription, ultrasound, other
Enum — file_type: pdf, jpg, png, docx, dicom
Audit: created_at, created_by

---

### DOMAIN 18 — Audit Logs

**AuditLog**
Immutable append-only event log. Never UPDATE or DELETE.
user_id is nullable to support system and integration events.
Fields: id (BIGSERIAL), user_id → user (RESTRICT, NULLABLE), actor_type,
        entity_name, entity_id, action_type, old_value (JSONB), new_value (JSONB),
        ip_address (INET), user_agent, created_at
Enum — actor_type: user, system, integration
Enum — action_type: create, update, delete, login, logout, upload, download
Rule: Partition by created_at (monthly) before go-live. No UPDATE or DELETE ever.
Note: created_by is not applicable here; actor_type + user_id serve that purpose.

---

### DOMAIN 19 — Phase 2 Only (excluded from MVP schema)

The following entities are documented for roadmap awareness.
They must NOT be created in the MVP migration.

| Entity | Reason deferred |
|---|---|
| InsuranceClaim | Insurance workflow requires InsuranceProvider master; out of MVP scope |
| PatientLogin | Mother mobile app is Phase 2 |
| DeviceToken | Requires PatientLogin; Phase 2 |
| Referral | Referral workflow not in MVP UI modules |
| DietOrder | Admitted diet orders need nutrition workflow; Phase 2 |
| OTBooking | Theatre scheduling is Phase 2 |
| NicuAdmission | NICU as a sub-admission entity is Phase 2; nicu_required flag on Newborn suffices for MVP |
| Partograph | Labour progress charting is Phase 2 clinical module |

Phase 2 recommended entities also include:
- ConsentRecord (medicolegal structured consent)
- AdmissionVital (continuous labour room monitoring)
- CareTeamMember (midwife, anaesthetist assignment per delivery)
- Supplier + PurchaseOrder (pharmacy procurement audit)
- InsuranceProvider + InsurancePolicy (full insurance workflow)

---

## PART 2 — UPDATED RELATIONSHIPS

### Core clinical chain (business rule enforced at DB level)
```
Patient
  └── Appointment (1:many)  ← soft-deletable
        └── Consultation (1:1 via UNIQUE FK)  ← soft-deletable
              ├── Prescription (1:many, append-only)
              │     └── PrescriptionItem (1:many, references Medicine)
              └── LabTest (1:many, consultation_id nullable)
                    └── LabReportFile (1:many, append-only)
```

### Patient master relationships
```
Patient (soft-deletable)
  ├── PatientEmergencyContact (junction, priority-ordered)
  │     └── EmergencyContact (reusable contact record)
  ├── PatientAllergy (1:many, survives across all pregnancies)
  ├── Pregnancy (1:many, soft-deletable)
  │     ├── AncVisit (1:many)
  │     ├── PregnancyRiskEvent (1:many)
  │     ├── Vaccination (1:many)
  │     └── WellnessPlan (1:1)
  ├── Admission (1:many, soft-deletable)
  │     ├── Bed (many:1)
  │     ├── WardTransfer (1:many)
  │     └── Delivery (1:1 via UNIQUE FK, soft-deletable)
  │           ├── DeliveryProcedure (1:many)
  │           └── Newborn (1:many, soft-deletable)
  │                 ├── NewbornVaccination (1:many)
  │                 ├── NewbornFeedingLog (1:many)
  │                 └── NewbornVital (1:many)
  ├── Bill (1:many)
  │     ├── BillItem (1:many)  ← replaces reference_id
  │     └── BillPayment (1:many)
  ├── PharmacySale (1:many)
  │     └── PharmacySaleItem → MedicineBatch → Medicine
  ├── EmergencyAlert (1:many)
  ├── Notification (1:many)
  └── MedicalDocument (1:many)
```

### Staff / HR relationships
```
User
  ├── UserRole (junction) → Role → RolePermission → Permission
  └── UserSession (1:many, per login event)

Staff
  ├── User (1:1, optional — some staff may not have system login)
  ├── Department (many:1)
  ├── Doctor (1:1 sub-type)
  ├── Attendance (1:many)
  ├── ShiftSchedule (1:many)
  ├── LeaveRequest (1:many)
  └── Salary (1:many)
```

### Removed relationship (Change 2)
~~Patient → EmergencyContact (single FK on patient.emergency_contact_id)~~
Replaced by: Patient → PatientEmergencyContact ← EmergencyContact

### Removed entity (Change 1)
~~PreviousPrescriptionNote~~
Previous prescriptions now served by: SELECT * FROM prescription WHERE patient_id = ? ORDER BY issued_at DESC

---

## PART 3 — FINAL TABLE LIST (MVP v2.0)

### Domain 1 — Authentication & RBAC (6 tables)
1.  user
2.  role
3.  permission
4.  user_role
5.  role_permission
6.  user_session

### Domain 2 — Hospital Configuration (2 tables)
7.  hospital
8.  department

### Domain 3 — People (6 tables)
9.  patient
10. emergency_contact
11. patient_emergency_contact          ← NEW (Change 2)
12. patient_allergy
13. staff
14. doctor

### Domain 4 — Pregnancy (5 tables)
15. pregnancy
16. anc_visit
17. pregnancy_risk_event
18. vaccination
19. wellness_plan

### Domain 5 — Appointments (1 table)
20. appointment

### Domain 6 — Consultations (1 table)
21. consultation
    [PreviousPrescriptionNote REMOVED — Change 1]

### Domain 7 — Prescriptions (2 tables)
22. prescription
23. prescription_item

### Domain 8 — Laboratory (2 tables)
24. lab_test
25. lab_report_file

### Domain 9 — Pharmacy (4 tables)
26. medicine
27. medicine_batch
28. pharmacy_sale
29. pharmacy_sale_item

### Domain 10 — Beds & Admissions (3 tables)
30. bed
31. admission
32. ward_transfer

### Domain 11 — Delivery (2 tables)
33. delivery
34. delivery_procedure

### Domain 12 — Newborn (4 tables)
35. newborn
36. newborn_vaccination
37. newborn_feeding_log
38. newborn_vital

### Domain 13 — Billing (3 tables)
39. bill
40. bill_item                           ← NEW (Change 3); replaces reference_id column
41. bill_payment
    [insurance_claim DEFERRED to Phase 2]

### Domain 14 — HR & Payroll (4 tables)
42. attendance
43. shift_schedule
44. leave_request
45. salary

### Domain 15 — Emergency SOS (1 table)
46. emergency_alert

### Domain 16 — Notifications (1 table)
47. notification

### Domain 17 — Medical Documents (1 table)
48. medical_document

### Domain 18 — Audit Logs (1 table)
49. audit_log

─────────────────────────────────────────────────
MVP TOTAL: 49 tables
Phase 2 deferred: 8 entities (InsuranceClaim, PatientLogin, DeviceToken, Referral,
                               DietOrder, OTBooking, NicuAdmission, Partograph)
─────────────────────────────────────────────────

---

## PART 4 — UPDATED CONSTRAINTS

### Business Rule Constraints (DB-enforced)

```
-- APPOINTMENT & CONSULTATION CHAIN
-- No walk-in consultations
consultation.appointment_id   NOT NULL
UNIQUE (consultation.appointment_id)

-- Token uniqueness per doctor per day
UNIQUE (appointment.doctor_id, appointment.appointment_datetime::date, appointment.token_number)

-- DELIVERY CHAIN
-- Delivery requires admission
delivery.admission_id         NOT NULL
UNIQUE (delivery.admission_id)    -- one delivery per admission

-- BILLING INTEGRITY
CHECK (bill.amount_paid >= 0)
CHECK (bill.total_amount >= 0)
CHECK (bill.amount_paid <= bill.total_amount)
CHECK (bill_item.quantity > 0)
CHECK (bill_item.unit_price >= 0)

-- BILL_ITEM replaces the old untyped reference_id on bill
-- bill_item.reference_id is nullable (soft reference, no DB FK)
-- bill.bill_type tells the application which table to join for typed references

-- EMERGENCY CONTACTS (Change 2)
UNIQUE (patient_emergency_contact.patient_id, patient_emergency_contact.contact_id)
CHECK  (patient_emergency_contact.priority > 0)

-- MEDICINE BATCH
UNIQUE (medicine_batch.medicine_id, medicine_batch.batch_number)
CHECK  (medicine_batch.expiry_date > medicine_batch.purchase_date)
CHECK  (medicine_batch.quantity >= 0)
UNIQUE (pharmacy_sale.invoice_number)
CHECK  (pharmacy_sale_item.qty > 0)

-- PREGNANCY
CHECK (pregnancy.edd > pregnancy.lmp)
CHECK (pregnancy.current_week BETWEEN 1 AND 45)
CHECK (pregnancy.trimester IN (1, 2, 3))

-- NEWBORN
UNIQUE (newborn.baby_mrn)
CHECK  (newborn.apgar_1min  BETWEEN 0 AND 10)
CHECK  (newborn.apgar_5min  BETWEEN 0 AND 10)

-- ADMISSION
CHECK (admission.actual_discharge IS NULL OR admission.actual_discharge > admission.admitted_at)

-- SESSION
CHECK (user_session.expires_at > user_session.issued_at)

-- HR
UNIQUE (attendance.staff_id, attendance.attendance_date)
UNIQUE (salary.staff_id, salary.month, salary.year)
UNIQUE (shift_schedule.staff_id, shift_schedule.shift_date, shift_schedule.shift_type)
CHECK  (salary.month BETWEEN 1 AND 12)
CHECK  (salary.year >= 2020)
CHECK  (leave_request.to_date >= leave_request.from_date)

-- NOTIFICATION
CHECK (notification.recipient_user_id IS NOT NULL OR notification.recipient_patient_id IS NOT NULL)

-- PERMISSION
UNIQUE (permission.module, permission.action)

-- USER
UNIQUE (user.username)
UNIQUE (user.email)

-- PATIENT
UNIQUE (patient.mrn)
UNIQUE (doctor.registration_no)
UNIQUE (medicine.name, medicine.category)
UNIQUE (bed.bed_number)
UNIQUE (wellness_plan.pregnancy_id)
UNIQUE (doctor.staff_id)
```

### Immutability Constraints (application-layer rules, documented here)

```
-- Prescription and PrescriptionItem: INSERT only.
-- No UPDATE or DELETE permitted once issued.
-- Previous prescriptions are fetched by querying:
--   SELECT * FROM prescription WHERE patient_id = :id ORDER BY issued_at DESC

-- LabReportFile: INSERT only per upload.
-- New file = new row. Existing file rows are never overwritten.

-- AuditLog: INSERT only. No UPDATE or DELETE ever.
-- Partition by created_at (monthly) before production deployment.

-- MedicineBatch.quantity: must use SELECT FOR UPDATE before decrement
-- to prevent race conditions under concurrent pharmacy dispensing.
```

### Soft Delete Constraints (Change 4 — applied to 7 tables)

```
Tables with soft delete support:
  patient, pregnancy, appointment, consultation, admission, delivery, newborn

Fields added to each:
  is_deleted   BOOLEAN      NOT NULL DEFAULT FALSE
  deleted_at   TIMESTAMPTZ  NULL

Rules:
  -- Hard DELETE is forbidden on all soft-delete tables.
  -- Records are archived by setting is_deleted = TRUE, deleted_at = NOW().
  -- All application queries must include:   WHERE is_deleted = FALSE
  -- Django: implement via a custom Manager that filters is_deleted = False by default.
  -- AuditLog entry must be written on every soft delete event.
  -- Cascade behaviour: soft-deleting a Patient does NOT cascade to child records automatically.
     Each child table (Pregnancy, Appointment, Admission, etc.) must be
     soft-deleted independently via application logic to preserve history.

Partial indexes for soft-delete performance:
  CREATE INDEX idx_patient_active     ON patient(mrn)               WHERE is_deleted = FALSE;
  CREATE INDEX idx_appt_active        ON appointment(patient_id)    WHERE is_deleted = FALSE;
  CREATE INDEX idx_consult_active     ON consultation(patient_id)   WHERE is_deleted = FALSE;
  CREATE INDEX idx_admit_active       ON admission(patient_id)      WHERE is_deleted = FALSE;
  CREATE INDEX idx_delivery_active    ON delivery(admission_id)     WHERE is_deleted = FALSE;
  CREATE INDEX idx_newborn_active     ON newborn(delivery_id)       WHERE is_deleted = FALSE;
  CREATE INDEX idx_pregnancy_active   ON pregnancy(patient_id)      WHERE is_deleted = FALSE;
```

### Audit Field Constraints (Change 5 — applied to all 49 MVP tables)

```
Fields added to every table:
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()   -- auto-updated via trigger or Django signal
  created_by   UUID         REFERENCES user(id) ON DELETE SET NULL

Exceptions and special cases:
  -- audit_log: no updated_at or created_by (append-only; actor captured in user_id + actor_type)
  -- AuditLog entries themselves record who wrote to every other table — no self-referential loop.
  -- Immutable tables (prescription, prescription_item, lab_report_file, pharmacy_sale_item):
     created_at and created_by are present; updated_at is present but must never change.
  -- updated_at: implement as a PostgreSQL trigger (SET updated_at = NOW() ON UPDATE)
     or via Django's auto_now=True — applied consistently to all non-immutable tables.
  -- created_by is nullable (NULL for system-generated rows, e.g. automated alerts).
```

---

## PART 5 — COMPLETE FOREIGN KEY MAP (v2.0)

### Authentication
```
user_role.user_id              → user.id            ON DELETE CASCADE
user_role.role_id              → role.id             ON DELETE CASCADE
role_permission.role_id        → role.id             ON DELETE CASCADE
role_permission.permission_id  → permission.id       ON DELETE CASCADE
user_session.user_id           → user.id             ON DELETE CASCADE
```

### Configuration
```
department.head_staff_id       → staff.id            ON DELETE SET NULL
```

### People
```
patient_emergency_contact.patient_id  → patient.id           ON DELETE CASCADE
patient_emergency_contact.contact_id  → emergency_contact.id ON DELETE CASCADE
patient_allergy.patient_id            → patient.id           ON DELETE CASCADE
patient_allergy.recorded_by           → user.id              ON DELETE SET NULL
staff.user_id                         → user.id              ON DELETE SET NULL
staff.department_id                   → department.id        ON DELETE SET NULL
doctor.staff_id                       → staff.id             ON DELETE CASCADE
```

### Pregnancy
```
pregnancy.patient_id           → patient.id          ON DELETE RESTRICT
pregnancy.assigned_doctor_id   → doctor.id           ON DELETE RESTRICT
anc_visit.pregnancy_id         → pregnancy.id        ON DELETE RESTRICT
anc_visit.doctor_id            → doctor.id           ON DELETE RESTRICT
pregnancy_risk_event.pregnancy_id → pregnancy.id     ON DELETE CASCADE
vaccination.pregnancy_id       → pregnancy.id        ON DELETE CASCADE
vaccination.administered_by    → doctor.id           ON DELETE SET NULL
wellness_plan.pregnancy_id     → pregnancy.id        ON DELETE CASCADE
```

### Appointment & Consultation
```
appointment.patient_id         → patient.id          ON DELETE RESTRICT
appointment.doctor_id          → doctor.id           ON DELETE RESTRICT
appointment.booked_by          → user.id             ON DELETE SET NULL
consultation.appointment_id    → appointment.id      ON DELETE RESTRICT  [UNIQUE]
consultation.patient_id        → patient.id          ON DELETE RESTRICT
consultation.doctor_id         → doctor.id           ON DELETE RESTRICT
```

### Prescription
```
prescription.consultation_id   → consultation.id     ON DELETE RESTRICT
prescription.patient_id        → patient.id          ON DELETE RESTRICT
prescription_item.prescription_id → prescription.id  ON DELETE CASCADE
prescription_item.medicine_id  → medicine.id         ON DELETE RESTRICT
```

### Laboratory
```
lab_test.patient_id            → patient.id          ON DELETE RESTRICT
lab_test.consultation_id       → consultation.id     ON DELETE RESTRICT   [nullable]
lab_test.ordered_by            → doctor.id           ON DELETE RESTRICT
lab_report_file.lab_test_id    → lab_test.id         ON DELETE CASCADE
lab_report_file.uploaded_by    → user.id             ON DELETE RESTRICT
```

### Pharmacy
```
medicine_batch.medicine_id          → medicine.id            ON DELETE RESTRICT
pharmacy_sale.prescription_id       → prescription.id        ON DELETE SET NULL
pharmacy_sale.patient_id            → patient.id             ON DELETE RESTRICT
pharmacy_sale.sold_by               → user.id                ON DELETE RESTRICT
pharmacy_sale_item.sale_id          → pharmacy_sale.id       ON DELETE CASCADE
pharmacy_sale_item.medicine_batch_id → medicine_batch.id     ON DELETE RESTRICT
```

### Beds & Admissions
```
admission.patient_id           → patient.id          ON DELETE RESTRICT
admission.bed_id               → bed.id              ON DELETE RESTRICT
admission.doctor_id            → doctor.id           ON DELETE RESTRICT
ward_transfer.admission_id     → admission.id        ON DELETE CASCADE
ward_transfer.from_bed_id      → bed.id              ON DELETE SET NULL
ward_transfer.to_bed_id        → bed.id              ON DELETE RESTRICT
ward_transfer.transferred_by   → user.id             ON DELETE SET NULL
```

### Delivery
```
delivery.admission_id          → admission.id        ON DELETE RESTRICT  [UNIQUE]
delivery.patient_id            → patient.id          ON DELETE RESTRICT
delivery.doctor_id             → doctor.id           ON DELETE RESTRICT
delivery_procedure.delivery_id → delivery.id         ON DELETE RESTRICT
delivery_procedure.performed_by → doctor.id          ON DELETE RESTRICT
```

### Newborn
```
newborn.delivery_id            → delivery.id         ON DELETE RESTRICT
newborn_vaccination.newborn_id → newborn.id          ON DELETE CASCADE
newborn_feeding_log.newborn_id → newborn.id          ON DELETE CASCADE
newborn_vital.newborn_id       → newborn.id          ON DELETE CASCADE
newborn_vital.recorded_by      → user.id             ON DELETE SET NULL
```

### Billing
```
bill.patient_id                → patient.id          ON DELETE RESTRICT
bill.admission_id              → admission.id        ON DELETE SET NULL
bill_item.bill_id              → bill.id             ON DELETE CASCADE
bill_payment.bill_id           → bill.id             ON DELETE RESTRICT
bill_payment.recorded_by       → user.id             ON DELETE SET NULL
```

### HR
```
attendance.staff_id            → staff.id            ON DELETE RESTRICT
shift_schedule.staff_id        → staff.id            ON DELETE CASCADE
leave_request.staff_id         → staff.id            ON DELETE CASCADE
leave_request.approved_by      → staff.id            ON DELETE SET NULL
salary.staff_id                → staff.id            ON DELETE RESTRICT
```

### System
```
emergency_alert.patient_id     → patient.id          ON DELETE RESTRICT
emergency_alert.doctor_id      → doctor.id           ON DELETE RESTRICT
emergency_alert.admission_id   → admission.id        ON DELETE SET NULL
emergency_alert.acknowledged_by → user.id            ON DELETE SET NULL
notification.recipient_user_id    → user.id          ON DELETE SET NULL
notification.recipient_patient_id → patient.id       ON DELETE SET NULL
medical_document.patient_id    → patient.id          ON DELETE RESTRICT
medical_document.uploaded_by   → user.id             ON DELETE RESTRICT
audit_log.user_id              → user.id             ON DELETE RESTRICT  [NULLABLE]
```

### Audit fields (all tables)
```
<every_table>.created_by       → user.id             ON DELETE SET NULL
```

---

## PART 6 — INDEX RECOMMENDATIONS (v2.0)

```sql
-- Patient (soft-delete aware — partial indexes)
CREATE INDEX idx_patient_mrn_active    ON patient(mrn)        WHERE is_deleted = FALSE;
CREATE INDEX idx_patient_name_trgm     ON patient USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_patient_phone         ON patient(phone);

-- Emergency contacts
CREATE INDEX idx_pec_patient           ON patient_emergency_contact(patient_id);
CREATE INDEX idx_pec_priority          ON patient_emergency_contact(patient_id, priority ASC);

-- Allergy (critical alert path — must be fast)
CREATE INDEX idx_allergy_patient       ON patient_allergy(patient_id);
CREATE INDEX idx_allergy_severity      ON patient_allergy(patient_id, severity);

-- Appointments
CREATE INDEX idx_appt_active           ON appointment(patient_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_appt_doctor_date      ON appointment(doctor_id, (appointment_datetime::date));
CREATE INDEX idx_appt_status           ON appointment(status)     WHERE is_deleted = FALSE;

-- Session (partial: active sessions only)
CREATE INDEX idx_session_token         ON user_session(token_hash);
CREATE INDEX idx_session_active        ON user_session(expires_at) WHERE revoked_at IS NULL;

-- Prescription lookup (previous Rx panel)
CREATE INDEX idx_rx_patient_issued     ON prescription(patient_id, issued_at DESC);
CREATE INDEX idx_rx_item_medicine      ON prescription_item(medicine_id);

-- FIFO dispensing
CREATE INDEX idx_batch_fifo            ON medicine_batch(medicine_id, expiry_date ASC);
CREATE INDEX idx_batch_expiry_alert    ON medicine_batch(expiry_date)
    WHERE quantity > 0;    -- only batches with remaining stock

-- Lab worklist
CREATE INDEX idx_lab_status_urgency    ON lab_test(status, urgency);
CREATE INDEX idx_lab_flagged           ON lab_test(flagged)  WHERE flagged = TRUE;

-- Bed occupancy dashboard
CREATE INDEX idx_bed_ward_status       ON bed(ward_type, status);
CREATE INDEX idx_admit_status_active   ON admission(status)  WHERE is_deleted = FALSE;

-- Delivery feed
CREATE INDEX idx_delivery_datetime     ON delivery(delivery_datetime) WHERE is_deleted = FALSE;

-- Billing
CREATE INDEX idx_bill_patient_type     ON bill(patient_id, bill_type);
CREATE INDEX idx_bill_payment_status   ON bill(payment_status);
CREATE INDEX idx_bill_item_bill        ON bill_item(bill_id);

-- HR
CREATE INDEX idx_attend_staff_date     ON attendance(staff_id, attendance_date);
CREATE INDEX idx_shift_staff_date      ON shift_schedule(staff_id, shift_date);

-- Audit log (high volume — partition monthly, then index)
CREATE INDEX idx_audit_entity          ON audit_log(entity_name, entity_id);
CREATE INDEX idx_audit_created         ON audit_log(created_at DESC);
CREATE INDEX idx_audit_user            ON audit_log(user_id)
    WHERE user_id IS NOT NULL;

-- Notifications
CREATE INDEX idx_notif_status_ch       ON notification(status, channel);
```

---

## PART 7 — ENTITY RELATIONSHIP MAP (v2.0)

```
User ─── UserRole ─── Role ─── RolePermission ─── Permission
│
└── UserSession

Staff ─── User
  │ ─── Department
  │ ─── Doctor
  ├── Attendance
  ├── ShiftSchedule
  ├── LeaveRequest
  └── Salary

Patient (soft delete)
  ├── PatientEmergencyContact ─── EmergencyContact   [CHANGED: junction replaces single FK]
  ├── PatientAllergy
  ├── Pregnancy (soft delete)
  │     ├── AncVisit
  │     ├── PregnancyRiskEvent
  │     ├── Vaccination
  │     └── WellnessPlan (1:1)
  │
  ├── Appointment (soft delete)
  │     └── Consultation (soft delete)              [PreviousPrescriptionNote REMOVED]
  │           ├── Prescription ─── PrescriptionItem ─── Medicine ─── MedicineBatch
  │           └── LabTest ─── LabReportFile
  │
  ├── PharmacySale ─── PharmacySaleItem ─── MedicineBatch
  │
  ├── Admission (soft delete)
  │     ├── Bed
  │     ├── WardTransfer
  │     └── Delivery (soft delete)
  │           ├── DeliveryProcedure
  │           └── Newborn (soft delete)
  │                 ├── NewbornVaccination
  │                 ├── NewbornFeedingLog
  │                 └── NewbornVital
  │
  ├── Bill
  │     ├── BillItem (line items)                   [CHANGED: replaces reference_id]
  │     └── BillPayment
  │
  ├── EmergencyAlert
  ├── Notification
  └── MedicalDocument

AuditLog (append-only, user_id nullable)
Hospital
Department
```

---

## PART 8 — PHASE 2 ENTITY SPECIFICATIONS (Documentation Only)

These entities are fully specified here for handoff to Phase 2 development.
Do NOT include them in any MVP migration file.

### InsuranceClaim
Purpose: Track insurance claims raised against bills.
Fields: id, bill_id → bill, insurer_name, policy_number, claim_number, submitted_at,
        status (submitted/processing/approved/rejected), approved_amount, notes
Depends on: bill, (Phase 2) InsuranceProvider, InsurancePolicy

### PatientLogin
Purpose: Consumer app authentication for mothers.
Fields: id, patient_id → patient (UNIQUE), email, password_hash (Argon2id),
        is_active, notif_email, notif_sms, notif_push, last_login

### DeviceToken
Purpose: Push notification token per registered device.
Fields: id, patient_login_id → patient_login, token (encrypted at rest via pgcrypto),
        platform (ios/android/web), registered_at, last_used_at

### Referral
Purpose: Track external clinic referrals and internal department-to-department transfers.
Fields: id, patient_id → patient, referred_by_name, referred_to_doctor_id → doctor,
        referral_type (external/internal), reason, referral_date, status

### DietOrder
Purpose: Structured diet orders for admitted patients (especially GDM).
Fields: id, admission_id → admission, prescribed_by → doctor, meal_type,
        instructions, valid_from, valid_to, notes

### OTBooking
Purpose: Operation theatre slot management for elective procedures.
Fields: id, patient_id → patient, ot_id → operation_theatre, surgery_type,
        scheduled_at, status, surgeon_id → doctor, notes
Depends on: OperationTheatre (new master table)

### NicuAdmission
Purpose: Newborn NICU as a trackable sub-admission with own bed and doctor.
Fields: id, newborn_id → newborn, bed_id → bed, admitted_at, discharged_at,
        assigned_doctor_id → doctor, status, notes
Note: Replaces the nicu_required boolean flag on Newborn in Phase 2.

### Partograph
Purpose: Labour progress chart — dilation, descent, contractions per observation.
Fields: id, admission_id → admission, recorded_at, cervical_dilation_cm,
        fetal_descent, contraction_duration_sec, contraction_frequency,
        membranes_status, moulding, recorded_by → user

