# MotherCare — Business Rules
## Shakuntala Hospital | Maternity Hospital Management System
**Version:** 1.0 MVP  
**Source:** UI (stitch_new_project) · Database Architecture v2.0 · Hospital Workflows  
**Last Updated:** 2026-06-06

> This document defines the authoritative business rules for all clinical and administrative workflows in MotherCare.  
> Rules marked **[DB]** are enforced at the database layer.  
> Rules marked **[APP]** are enforced at the application layer.  
> Rules marked **[UI]** are enforced at the UI layer in addition to APP/DB.

---

## 1. Patient Workflow

### 1.1 Registration
- **BR-PAT-01 [DB]:** Every patient must be assigned a unique Medical Record Number (MRN) at registration. No two patients may share an MRN. `UNIQUE(mrn)`
- **BR-PAT-02 [APP]:** MRN format: `PT-XXXX-X` (e.g., `PT-8472-A`). Generated automatically at registration; never manually assigned.
- **BR-PAT-03 [APP]:** The following fields are mandatory at registration: `full_name`, `dob`, `phone`, `blood_group`.
- **BR-PAT-04 [APP]:** A patient may have zero or one active pregnancy at any time. Multiple historical pregnancies are permitted on the same patient record.
- **BR-PAT-05 [APP]:** Patient allergies are recorded at the patient level (not the pregnancy level) so they persist across all pregnancies and surface at prescription time.
- **BR-PAT-06 [APP]:** A patient may have multiple emergency contacts. Each contact carries a `relationship_type` and a `priority` integer (1 = primary). No two entries for the same patient/contact pair. `UNIQUE(patient_id, contact_id)`

### 1.2 Patient Identity & Search
- **BR-PAT-07 [APP]:** Patient search supports: MRN (exact), full name (trigram fuzzy), phone number (exact).
- **BR-PAT-08 [UI]:** Patient roster supports filter by risk status: All / High Risk / 3rd Trimester.
- **BR-PAT-09 [UI]:** Patient profile card shows: MRN, age, blood group, current pregnancy week, EDD, risk status, upcoming appointments, recent documents, emergency contact.

### 1.3 Deletion & Archiving
- **BR-PAT-10 [DB]:** Hard DELETE is forbidden on the `patient` table. Patient records are soft-deleted by setting `is_deleted = TRUE` and `deleted_at = NOW()`.
- **BR-PAT-11 [APP]:** Soft-deleting a Patient does NOT automatically cascade to child records (Pregnancy, Appointment, Admission, etc.). Each child must be independently soft-deleted via application logic.
- **BR-PAT-12 [APP]:** An AuditLog entry must be written on every patient soft delete.

### 1.4 Allergy Alerts
- **BR-PAT-13 [APP]:** Allergy severity values: `mild`, `moderate`, `severe`, `life_threatening`.
- **BR-PAT-14 [UI]:** Allergy list is displayed in the right panel of the consultation workspace. A visual alert is shown if any PrescriptionItem's medicine generic name matches a recorded allergen.
- **BR-PAT-15 [APP]:** Allergy check must be performed before saving any PrescriptionItem.

---

## 2. Appointment Workflow

### 2.1 Booking Rules
- **BR-APPT-01 [DB]:** Every consultation must originate from a booked appointment. No walk-in consultations are permitted at the database level. `consultation.appointment_id NOT NULL`
- **BR-APPT-02 [DB]:** Token numbers must be unique per doctor per calendar day. `UNIQUE(doctor_id, appointment_datetime::date, token_number)`
- **BR-APPT-03 [APP]:** Token numbers are auto-assigned sequentially per doctor per day starting from 101. They are never manually reassigned.
- **BR-APPT-04 [APP]:** Only active (non-deleted) doctors with a matching availability window may be booked for an appointment.
- **BR-APPT-05 [APP]:** Appointment types: `new_patient`, `follow_up`, `anc`, `emergency`, `scan`, `lab_review`, `gdm_screen`, `ultrasound`.
- **BR-APPT-06 [APP]:** A follow-up appointment scheduled from within a consultation carries the consultation's `follow_up_datetime` as the appointment datetime.

### 2.2 Status Lifecycle
```
scheduled → confirmed → in_progress → completed
                     ↘ cancelled
                     ↘ no_show
```
- **BR-APPT-07 [APP]:** Status transitions are one-directional. A completed or cancelled appointment cannot be reverted.
- **BR-APPT-08 [APP]:** When a consultation is created for an appointment, the appointment status automatically advances to `in_progress`.
- **BR-APPT-09 [APP]:** When the consultation status is set to `completed`, the appointment status automatically advances to `completed`.
- **BR-APPT-10 [APP]:** A `no_show` status is set manually by reception if the patient does not arrive by a configurable grace period.

### 2.3 Cancellation
- **BR-APPT-11 [APP]:** Cancellation is soft: `status = 'cancelled'`, not a hard delete. `is_deleted` remains `FALSE` unless explicitly soft-deleted by an admin.
- **BR-APPT-12 [APP]:** A cancelled appointment's token number is retired and not reassigned to another patient on the same day.

### 2.4 Doctor Availability
- **BR-APPT-13 [DB]:** Doctor availability hours are stored as `available_from (TIME)` and `available_to (TIME)` on the `Doctor` record.
- **BR-APPT-14 [UI]:** Doctor Availability panel on the appointment dashboard shows: current status (On Duty / On Leave / Away), next available slot.

---

## 3. Consultation Workflow

### 3.1 Creation Rules
- **BR-CONS-01 [DB]:** One consultation per appointment — enforced by `UNIQUE(consultation.appointment_id)`.
- **BR-CONS-02 [APP]:** A consultation can only be created if the parent appointment status is `confirmed` or `in_progress`. It cannot be created for a `cancelled`, `no_show`, or already `completed` appointment.
- **BR-CONS-03 [APP]:** Consultation inherits `patient_id` and `doctor_id` from the parent appointment at creation. These fields cannot be changed after creation.

### 3.2 Workspace
- **BR-CONS-04 [UI]:** The consultation workspace displays on the right panel: patient allergy summary, chronic conditions, pregnancy status (week, EDD, risk), prior pregnancy history (Gravida, Para).
- **BR-CONS-05 [APP]:** Previous prescriptions are fetched as: `SELECT * FROM prescription WHERE patient_id = ? ORDER BY issued_at DESC`. No separate junction table.
- **BR-CONS-06 [APP]:** Recent lab reports (last 3–5) are displayed within the consultation workspace.

### 3.3 Status Lifecycle
```
in_progress → completed
           ↘ cancelled
```
- **BR-CONS-07 [APP]:** A completed consultation is effectively immutable — clinical notes and prescriptions issued during it cannot be altered.
- **BR-CONS-08 [DB]:** `CHECK(end_time IS NULL OR end_time > start_time)` — end time must be after start time.

### 3.4 Follow-Up
- **BR-CONS-09 [UI]:** The follow-up scheduler within the consultation allows selection of date and time. Saving creates a new `follow_up` type Appointment linked to the same patient and doctor.
- **BR-CONS-10 [APP]:** A consultation may have at most one follow-up datetime. If a follow-up is rescheduled, the existing follow-up appointment must be cancelled before a new one is created.

---

## 4. Prescription Workflow

### 4.1 Immutability
- **BR-RX-01 [APP]:** Prescriptions are immutable. No `UPDATE` or `DELETE` is permitted on the `prescription` or `prescription_item` tables once a prescription is issued.
- **BR-RX-02 [APP]:** If a prescription error is discovered, a corrected prescription must be issued as a new record. The old prescription is retained with an audit note.

### 4.2 Medicine Constraint
- **BR-RX-03 [DB]:** Every `PrescriptionItem` must reference a `medicine.id` from the formulary. Free-text drug names are not permitted. `medicine_id NOT NULL, FK → medicine(id) ON DELETE RESTRICT`
- **BR-RX-04 [APP]:** If the required medicine is not in the formulary, it must first be added to the `Medicine` master by a user with Pharmacist or Admin role.

### 4.3 Allergy Check
- **BR-RX-05 [APP]:** Before saving a PrescriptionItem, the system checks if the medicine's `generic_name` matches any allergen recorded for the patient. If a match is found at severity `severe` or `life_threatening`, a blocking alert is shown and the prescription cannot be saved without an explicit override.
- **BR-RX-06 [UI]:** For severity `mild` or `moderate`, a non-blocking warning is shown. The doctor may proceed.

### 4.4 Dispensing Link
- **BR-RX-07 [APP]:** A PharmacySale may be linked to a Prescription via `pharmacy_sale.prescription_id`. This link is optional (walk-in OTC sales have `prescription_id = NULL`).
- **BR-RX-08 [APP]:** A Prescription may only be dispensed once. If a PharmacySale already exists for a prescription, the Pharmacy module must not allow a second sale for the same prescription (unless it is a partial fill — partial fill logic is Phase 2).

---

## 5. Laboratory Workflow

### 5.1 Test Ordering
- **BR-LAB-01 [APP]:** Lab tests may be ordered from within a consultation (`consultation_id` populated) or independently by a doctor (`consultation_id = NULL`).
- **BR-LAB-02 [APP]:** Only users with Doctor or Lab Technician role may order tests. Urgency is set by the ordering doctor.
- **BR-LAB-03 [APP]:** Urgency levels and their display priority: `STAT` (red, immediate) > `urgent` > `routine`.

### 5.2 Pending Queue
- **BR-LAB-04 [UI]:** The pending test queue displays all tests with status `pending` or `in_progress`, sorted by urgency (STAT first) then by `requested_at` ascending.
- **BR-LAB-05 [APP]:** Lab technicians may update status from `pending` → `in_progress` → `completed`.
- **BR-LAB-06 [APP]:** A test may be marked `critical` only when `status = completed` and the result value exceeds a critical threshold (configured per test type in Phase 2; manual flag for MVP).
- **BR-LAB-07 [APP]:** A cancelled test cannot be moved to any other status.

### 5.3 Report Upload
- **BR-LAB-08 [APP]:** Lab report files are append-only. Each upload creates a new `LabReportFile` row. Existing file rows are never overwritten or deleted.
- **BR-LAB-09 [APP]:** Permitted file types: `pdf`, `jpg`, `png`, `dicom`.
- **BR-LAB-10 [APP]:** A lab test may have one or more report files. The test is not considered complete until at least one file is uploaded.

### 5.4 Flagged Results
- **BR-LAB-11 [APP]:** Setting `flagged = TRUE` on a LabTest triggers a notification to the ordering doctor.
- **BR-LAB-12 [UI]:** Flagged results appear in the "Flagged Results" KPI count on the Lab Management dashboard and as alerts in the dashboard's Recent Activity feed.

---

## 6. Admission Workflow

### 6.1 Admission Intake
- **BR-ADM-01 [APP]:** Before creating an Admission, the system must verify that no other `active` Admission exists for the same patient. A patient may not have two concurrent active admissions.
- **BR-ADM-02 [APP]:** A bed must be in `available` status before it can be assigned to an Admission. Attempting to admit to an `occupied`, `cleaning`, `maintenance`, or `reserved` bed raises a validation error.
- **BR-ADM-03 [APP]:** When a patient is admitted, the assigned bed's status changes to `occupied` immediately within the same transaction.
- **BR-ADM-04 [APP]:** Admission types: `maternity`, `post_natal`, `emergency`, `surgery`.
- **BR-ADM-05 [DB]:** `CHECK(actual_discharge IS NULL OR actual_discharge > admitted_at)` — discharge time must be after admission time.

### 6.2 Status Lifecycle
```
active → discharge_pending → discharged
      ↘ transferred
      ↘ deceased
```
- **BR-ADM-06 [APP]:** Status transitions are one-directional. A `discharged` or `deceased` admission cannot be re-activated.
- **BR-ADM-07 [APP]:** When status changes to `discharged`, the associated bed's status must change to `cleaning` automatically within the same transaction.

### 6.3 Ward Transfers
- **BR-ADM-08 [APP]:** A ward transfer moves a patient from their current bed to a new bed within the same admission. This does NOT create a new Admission.
- **BR-ADM-09 [APP]:** Ward transfer steps (all within one transaction):
  1. Set `from_bed.status = 'cleaning'`
  2. Validate `to_bed.status = 'available'`
  3. Set `to_bed.status = 'occupied'`
  4. Update `admission.bed_id = to_bed_id`
  5. Create `WardTransfer` record with reason and transferring user
- **BR-ADM-10 [APP]:** The full transfer history (all `WardTransfer` records for an admission) must be retained and viewable on the admission chart.

### 6.4 Bed Status Board
- **BR-ADM-11 [UI]:** Ward types displayed: General, Private, Labor, NICU, ICU.
- **BR-ADM-12 [UI]:** Bed occupancy percentage is displayed per ward type.
- **BR-ADM-13 [APP]:** Emergency Admission bypasses the standard intake form — only patient ID and bed selection are required. A reason and doctor assignment may be completed within 30 minutes.

---

## 7. Delivery Workflow

### 7.1 Prerequisites
- **BR-DEL-01 [DB]:** A Delivery record can only be created if a corresponding Admission exists. `delivery.admission_id NOT NULL, FK → admission(id) ON DELETE RESTRICT`
- **BR-DEL-02 [DB]:** One delivery per admission. `UNIQUE(delivery.admission_id)`
- **BR-DEL-03 [APP]:** The admission must be in `active` status at the time of delivery record creation. Delivery cannot be recorded against a discharged admission.

### 7.2 Delivery Recording
- **BR-DEL-04 [APP]:** Delivery modes: `normal`, `c_section`, `assisted`, `water_birth`.
- **BR-DEL-05 [APP]:** Mandatory fields: `delivery_datetime`, `delivery_mode`, `doctor_id`. Other fields (blood_loss, placenta_complete, complications) are strongly recommended but not DB-mandatory.
- **BR-DEL-06 [APP]:** For C-section deliveries, at least one `DeliveryProcedure` record must be created (procedure_name = 'Caesarean Section').
- **BR-DEL-07 [APP]:** `blood_loss_ml` is recorded in millilitres. A value > 500 ml for normal delivery or > 1000 ml for C-section should trigger an automated high-risk flag (MVP: manual flag; Phase 2: automated).
- **BR-DEL-08 [APP]:** Once a Delivery record is created, it is effectively immutable. Corrections require soft-delete of the delivery and creation of a corrected record (requires Admin role).

### 7.3 Post-Delivery
- **BR-DEL-09 [APP]:** After delivery is recorded, the system prompts the nurse/doctor to register newborn(s) via the Newborn Management module.
- **BR-DEL-10 [APP]:** Delivery status is reflected on the admission status. A post-natal patient should have their admission type updated to `post_natal` after delivery.

---

## 8. Newborn Workflow

### 8.1 Registration
- **BR-NB-01 [DB]:** Every newborn must be registered against an existing Delivery record. `newborn.delivery_id NOT NULL, FK → delivery(id) ON DELETE RESTRICT`
- **BR-NB-02 [DB]:** Each newborn is assigned a unique Baby MRN. `UNIQUE(baby_mrn)`. Format: `NB-YYYY-XXX` (e.g., `NB-2023-042`).
- **BR-NB-03 [APP]:** Multiple newborns per delivery are supported (twins, triplets). There is no upper limit at the DB level.
- **BR-NB-04 [APP]:** Mandatory fields at registration: `gender`, `birth_weight_kg`, `apgar_1min`, `apgar_5min`, `condition`.
- **BR-NB-05 [DB]:** APGAR scores must be between 0 and 10. `CHECK(apgar_1min BETWEEN 0 AND 10)`, `CHECK(apgar_5min BETWEEN 0 AND 10)`

### 8.2 NICU Routing
- **BR-NB-06 [APP]:** If a newborn's `condition = 'nicu_required'` or `nicu_required = TRUE`, the nurse must assign the baby to an available NICU bed within the bed management module.
- **BR-NB-07 [APP]:** NICU bed assignment for newborns follows the same availability rules as adult admissions: the selected NICU bed must be in `available` status.
- **BR-NB-08 [UI]:** NICU status is displayed on the Active Newborn Registry and highlighted visually (e.g., a "Critical" badge).

### 8.3 Vaccination
- **BR-NB-09 [APP]:** Newborn vaccinations are tracked independently from maternal vaccinations (separate table).
- **BR-NB-10 [APP]:** Standard birth vaccinations (Hepatitis B, BCG, OPV Dose 0) must be presented as a checklist on newborn registration.
- **BR-NB-11 [APP]:** Vaccine status values: due, administered (with date), not_required, skipped (with reason).
- **BR-NB-12 [UI]:** Vaccination due alerts surface on the Newborn Management dashboard KPI strip.

### 8.4 Feeding Logs
- **BR-NB-13 [APP]:** Feeding log entries are time-stamped and append-only. Entries are never deleted.
- **BR-NB-14 [APP]:** Feed types: `breast`, `formula`, `ng_tube`, `iv`.
- **BR-NB-15 [APP]:** Volume in ml is required for `formula`, `ng_tube`, and `iv` feeds. Optional for `breast` feeds.

### 8.5 Vitals Tracking
- **BR-NB-16 [APP]:** Newborn vitals are recorded periodically: `weight_kg`, `head_circ_cm`, `temperature`, `recorded_at`.
- **BR-NB-17 [UI]:** Growth trend chart visualises weight and head circumference over time from birth to current date.

### 8.6 Mother Linkage
- **BR-NB-18 [APP]:** The mother's identity is reached via the chain: `Newborn → Delivery → Admission → Patient`. No redundant `mother_id` column exists on the Newborn table.

---

## 9. Billing Workflow

### 9.1 Bill Creation
- **BR-BILL-01 [APP]:** Bills are line-item normalised. Every charge must be recorded as a `BillItem` row — no lump-sum reference IDs.
- **BR-BILL-02 [APP]:** Bill types: `consultation`, `lab`, `pharmacy`, `admission`, `misc`.
- **BR-BILL-03 [APP]:** A patient may have multiple bills of different types. There is no limit on the number of bills per patient.
- **BR-BILL-04 [APP]:** Miscellaneous (`misc`) BillItems do not require a `reference_id`. All other item types should carry a `reference_id` pointing to the source entity (consultation.id, lab_test.id, etc.). The reference is a soft reference (no DB-level FK).
- **BR-BILL-05 [APP]:** `total_amount` on a Bill is the sum of all its `BillItem.total_price` values. It must be recalculated whenever BillItems are added or modified.
- **BR-BILL-06 [DB]:** `CHECK(amount_paid >= 0)`, `CHECK(total_amount >= 0)`, `CHECK(amount_paid <= total_amount)` — enforced at DB level.

### 9.2 Payment Rules
- **BR-BILL-07 [APP]:** Multiple payments are permitted per bill (partial payment workflow).
- **BR-BILL-08 [APP]:** Each payment creates a new `BillPayment` row. The `bill.amount_paid` field is updated by summing all `BillPayment.amount` values for that bill.
- **BR-BILL-09 [APP]:** Payment methods: `cash`, `card`, `upi`, `netbanking`, `insurance`, `cheque`.
- **BR-BILL-10 [APP]:** Payment status is derived from `amount_paid` vs `total_amount`:
  - `paid` — `amount_paid = total_amount`
  - `partial` — `0 < amount_paid < total_amount`
  - `pending` — `amount_paid = 0`
  - `overdue` — `pending` or `partial` past the due date (configurable)
  - `refunded` — manually set by Finance Officer

### 9.3 Invoice Generation
- **BR-BILL-11 [APP]:** Every bill generates a unique invoice number in the format `INV-YYYY-NNNN` (e.g., `INV-2024-001`). Sequence is per calendar year.
- **BR-BILL-12 [UI]:** Invoice PDF can be generated and downloaded from the Billing & Payments screen.
- **BR-BILL-13 [UI]:** Quick billing shortcuts on the dashboard: Consultation / Laboratory / Pharmacy / Admission — each opens a pre-typed bill creation form.

### 9.4 Admission Bills
- **BR-BILL-14 [APP]:** Admission bills may be linked to an `admission_id` (`bill.admission_id`). This link is optional — consultation, lab, and pharmacy bills are not linked to admissions.
- **BR-BILL-15 [APP]:** When a patient is discharged, the system should prompt the billing team to generate any pending Admission bill.

### 9.5 Insurance
- **BR-BILL-16 [MVP]:** Insurance claims are tracked as a KPI count on the billing dashboard ("Insurance Claims"). Full claims workflow (InsuranceClaim entity) is Phase 2.
- **BR-BILL-17 [APP]:** Payment method `insurance` on a BillPayment is sufficient for MVP tracking.

---

## 10. Cross-Cutting Rules

### Audit Trail
- **BR-AUD-01 [APP]:** An `AuditLog` entry must be written for every: `create`, `update`, `delete`, `login`, `logout`, `upload`, `download` event across all entities.
- **BR-AUD-02 [DB]:** `AuditLog` is append-only. No `UPDATE` or `DELETE` is ever permitted.
- **BR-AUD-03 [APP]:** `actor_type` on AuditLog: `user` (staff action), `system` (automated trigger), `integration` (external API).
- **BR-AUD-04 [APP]:** `old_value` and `new_value` are stored as JSONB snapshots of the relevant fields at the time of the event.

### Soft Delete Cascade
- **BR-SD-01 [APP]:** Soft-delete tables: `patient`, `pregnancy`, `appointment`, `consultation`, `admission`, `delivery`, `newborn`.
- **BR-SD-02 [APP]:** Hard `DELETE` SQL is forbidden on all soft-delete tables. Application code must never call `.delete()` on these model instances.
- **BR-SD-03 [APP]:** All application queries on soft-delete tables must use the default manager which filters `is_deleted = FALSE`. Raw queries that bypass this filter are forbidden.
- **BR-SD-04 [APP]:** Soft-deleting a parent does not auto-cascade. Each child entity must be independently soft-deleted. Example: soft-deleting a Patient requires separately soft-deleting all their Pregnancies, Appointments, Admissions, Deliveries, and Newborns.

### Emergency Alerts
- **BR-EMRG-01 [APP]:** Emergency alerts may be triggered by any ward staff user. They are linked to the patient, the responsible doctor, and optionally the active admission.
- **BR-EMRG-02 [APP]:** Alert status lifecycle: `triggered` → `acknowledged` → `resolved`. Each transition records the acknowledging user and timestamp.
- **BR-EMRG-03 [APP]:** Response time in seconds is calculated as `acknowledged_at - triggered_at` and stored on the alert record.
- **BR-EMRG-04 [UI]:** Active emergency alerts appear immediately in the dashboard Recent Activity feed with a red priority indicator.

### Notification Rules
- **BR-NOTIF-01 [DB]:** Every notification must have at least one recipient: `CHECK(recipient_user_id IS NOT NULL OR recipient_patient_id IS NOT NULL)`.
- **BR-NOTIF-02 [APP]:** Notification channels: `email`, `sms`, `whatsapp`, `push`. MVP: email and SMS. WhatsApp and push are Phase 2.
- **BR-NOTIF-03 [APP]:** Failed notifications (status = `failed`) must log the error message for retry and debugging.

### Pharmacy Concurrency
- **BR-PHAR-01 [DB]:** `MedicineBatch.quantity` must never be decremented without first acquiring a `SELECT FOR UPDATE` lock on the batch row.
- **BR-PHAR-02 [APP]:** If FIFO dispensing requires splitting across multiple batches, each batch is locked and decremented within a single `transaction.atomic()` block.
- **BR-PHAR-03 [DB]:** `CHECK(medicine_batch.quantity >= 0)` — stock can never go negative. Insufficient stock raises an application error before the transaction is committed.

---

*MotherCare Business Rules v1.0 — Shakuntala Hospital — Maternity Hospital Management System*
