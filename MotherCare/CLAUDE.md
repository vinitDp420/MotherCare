# MotherCare — CLAUDE.md
## Shakuntala Hospital | Maternity Hospital Management System
> This file is the authoritative engineering guide for all AI-assisted and human development on the MotherCare project.  
> Read this file before writing any code. Follow every rule exactly.

---

## 1. Project Context

**MotherCare** is a single-hospital maternity HIS (Hospital Information System) for Shakuntala Hospital.  
It manages the complete maternity journey: patient registration → pregnancy tracking → appointments → consultations → prescriptions → lab → pharmacy → admission → delivery → newborn → billing.

- **Hospital:** Shakuntala Hospital (code: `SH-MAT-2024`), New Delhi
- **Phase:** MVP v2.0 (49 tables, 18 domains)
- **Architecture document:** `mothercare_final_architecture_v2.md` — this is the source of truth for the schema
- **PRD:** `PRD.md` — source of truth for features and requirements
- **Business Rules:** `BUSINESS_RULES.md` — source of truth for workflow logic

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend Framework | Django | 4.2 LTS |
| API Layer | Django REST Framework (DRF) | 3.14+ |
| Database | PostgreSQL | 15+ |
| Auth | DRF Token Auth + custom UserSession model | — |
| File Storage | Django default storage (local dev); S3-compatible (production) | — |
| Frontend | React (separate repo) | 18+ |
| Task Queue | Celery + Redis | (Phase 2 notifications) |
| ORM | Django ORM (never raw SQL except for documented exceptions) | — |

### Python Environment
- Use `uv` for package management (not pip, not poetry)
- Python 3.11+
- All dependencies pinned in `pyproject.toml`

---

## 3. Coding Standards

### General
- **PEP 8** strictly — enforced via `ruff` linter
- **Type hints** on all function signatures (Django views, serializers, service functions)
- **Docstrings** on all public classes and non-trivial functions (Google style)
- **No magic numbers** — define constants in a module-level `constants.py` per app
- **No bare `except:`** — always catch specific exception types

### Django Specific
- Use **class-based views (CBV)** for all API endpoints via DRF `ViewSet`
- Use **`get_object_or_404`** — never `.get()` without try/except
- Use **`select_related`** and **`prefetch_related`** to avoid N+1 queries
- Use **`F()` expressions** for atomic field updates (especially `quantity` decrement)
- Use **`transaction.atomic()`** for multi-table writes
- Use **`select_for_update()`** before decrementing `medicine_batch.quantity`

### DRF Specific
- One serializer per action where shapes differ: `ListSerializer`, `DetailSerializer`, `WriteSerializer`
- Use **`SerializerMethodField`** for computed/derived fields
- Never nest mutable serializers more than 2 levels deep
- Validate business rules in `serializer.validate()` — not in the view

### Testing
- `pytest` with `pytest-django`
- Minimum coverage: **80%** for all service functions and serializers
- Factory functions via `factory_boy` — no fixtures
- Test file structure mirrors app structure: `tests/test_models.py`, `tests/test_views.py`, `tests/test_serializers.py`

---

## 4. Architecture Rules

### App Structure
```
mothercare/
├── apps/
│   ├── auth_rbac/          # Domain 1: Users, Roles, Permissions, Sessions
│   ├── hospital_config/    # Domain 2: Hospital, Department
│   ├── people/             # Domain 3: Patient, Staff, Doctor, EmergencyContact, Allergy
│   ├── pregnancy/          # Domain 4: Pregnancy, AncVisit, RiskEvent, Vaccination, WellnessPlan
│   ├── appointments/       # Domain 5: Appointment
│   ├── consultations/      # Domain 6: Consultation
│   ├── prescriptions/      # Domain 7: Prescription, PrescriptionItem
│   ├── laboratory/         # Domain 8: LabTest, LabReportFile
│   ├── pharmacy/           # Domain 9: Medicine, MedicineBatch, PharmacySale, PharmacySaleItem
│   ├── admissions/         # Domain 10: Bed, Admission, WardTransfer
│   ├── delivery/           # Domain 11: Delivery, DeliveryProcedure
│   ├── newborn/            # Domain 12: Newborn, NewbornVaccination, NewbornFeedingLog, NewbornVital
│   ├── billing/            # Domain 13: Bill, BillItem, BillPayment
│   ├── hr/                 # Domain 14: Attendance, ShiftSchedule, LeaveRequest, Salary
│   ├── emergency/          # Domain 15: EmergencyAlert
│   ├── notifications/      # Domain 16: Notification
│   ├── documents/          # Domain 17: MedicalDocument
│   └── audit/              # Domain 18: AuditLog
├── core/
│   ├── models.py           # BaseModel, SoftDeleteModel abstract base classes
│   ├── managers.py         # SoftDeleteManager (filters is_deleted=False by default)
│   ├── permissions.py      # Custom DRF permission classes
│   ├── pagination.py       # Standard pagination classes
│   ├── exceptions.py       # Custom exception types
│   └── utils.py            # Shared utilities
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
└── manage.py
```

### Layer Rules
- **Models** — DB schema only. No business logic in models (exception: DB-level properties)
- **Services** — All business logic lives in `services.py` per app. Views call services; services call models
- **Serializers** — Input validation and data transformation only
- **Views** — Orchestration only: call serializer → call service → return response
- **Signals** — Use only for: updating `updated_at`, writing to AuditLog, triggering Notifications

### API URL Patterns
```
/api/v1/auth/
/api/v1/patients/
/api/v1/pregnancies/
/api/v1/appointments/
/api/v1/consultations/
/api/v1/prescriptions/
/api/v1/laboratory/
/api/v1/pharmacy/
/api/v1/admissions/
/api/v1/beds/
/api/v1/delivery/
/api/v1/newborns/
/api/v1/billing/
/api/v1/hr/
/api/v1/emergency/
/api/v1/notifications/
/api/v1/documents/
/api/v1/audit/
/api/v1/reports/
/api/v1/settings/
```

---

## 5. Database Rules

### Schema Source of Truth
The canonical schema is defined in `mothercare_final_architecture_v2.md`.  
All Django models must match that document exactly. If there is a conflict, the architecture document wins.

### Migration Rules
- One migration file per app per meaningful change
- Never edit a migration that has been applied to any environment
- Phase 2 entities (InsuranceClaim, PatientLogin, etc.) must **NOT** appear in any MVP migration
- Run `makemigrations --check` in CI to detect unapplied model changes

### Soft Delete Rules
```python
# Tables with soft delete: patient, pregnancy, appointment, consultation, admission, delivery, newborn

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()  # bypass soft delete for admin/audit use

    def soft_delete(self, user=None):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()
        # AuditLog.log('delete', self, user)  # always write audit entry

    class Meta:
        abstract = True
```

- Hard `DELETE` SQL is forbidden on all soft-delete tables
- Soft-deleting a Patient does NOT cascade to children automatically — each child table must be soft-deleted independently via application logic
- All queries on soft-delete models must use the default manager (which filters `is_deleted=False`)

### Immutability Rules
- `Prescription` and `PrescriptionItem`: INSERT only. No UPDATE or DELETE permitted
- `LabReportFile`: INSERT only. New upload = new row, never overwrite
- `AuditLog`: INSERT only. No UPDATE or DELETE ever
- Enforce immutability in the model's `save()` by raising `PermissionDenied` if the record already exists
- Use a custom model method `is_immutable = True` as a guard flag

### Concurrency Rules
- Always use `select_for_update()` before decrementing `MedicineBatch.quantity`
- Wrap pharmacy dispensing in `transaction.atomic()`
- Use `F('quantity') - qty` expression for atomic decrement — never read then write

### Audit Field Rules
- Every model must inherit from `AuditModel` which provides `created_at`, `updated_at`, `created_by`
- `created_by` is nullable (NULL for system-generated rows)
- `updated_at` is auto-updated via Django's `auto_now=True` or a PostgreSQL trigger
- Do NOT manually set `created_at` or `updated_at` in application code

### Constraint Enforcement
- All constraints listed in `PART 4` of the architecture document must have corresponding Django model validators
- DB-level constraints (CHECK, UNIQUE) are required in addition to Django validation — not instead of it

### Query Patterns
```python
# Previous prescriptions panel — use this exact query pattern:
Prescription.objects.filter(patient_id=patient_id).order_by('-issued_at')

# FIFO dispensing — use this exact ordering:
MedicineBatch.objects.filter(
    medicine_id=medicine_id,
    quantity__gt=0
).select_for_update().order_by('expiry_date', 'purchase_date')

# Allergy check at prescription time:
PatientAllergy.objects.filter(patient_id=patient_id, allergen__iexact=medicine_generic_name)
```

---

## 6. Development Rules

### Absolute Prohibitions
- **Never use raw SQL** except in documented migration scripts and the FIFO batch query (use ORM)
- **Never call `delete()` on soft-delete model instances** — always use `soft_delete()`
- **Never modify Prescription or PrescriptionItem rows** after creation
- **Never modify LabReportFile or AuditLog rows** after creation
- **Never decrement `MedicineBatch.quantity`** outside a `select_for_update()` block
- **Never create any Phase 2 entity** (InsuranceClaim, PatientLogin, etc.) in MVP code
- **Never expose raw session tokens** in API responses — return only opaque token references
- **Never hard-code hospital ID** — always read from settings or the Hospital singleton

### Required Patterns
- **Write AuditLog** for every create, update, delete, login, logout, upload, download event
- **Check patient allergies** before saving any PrescriptionItem
- **Validate token uniqueness** before creating an Appointment (doctor + date + token)
- **Validate admission exists** before creating a Delivery record
- **Validate bed availability** before creating an Admission

### Error Handling
- Return DRF standard error format: `{"detail": "...", "code": "...", "field": "..."}`
- Use HTTP 422 for business rule violations (not 400)
- Use HTTP 409 for constraint conflicts (duplicate token, double booking)
- Log all 5xx errors with request ID, user ID, and stack trace

### Environment Configuration
- All secrets in environment variables — never in code or version control
- `DATABASE_URL`, `SECRET_KEY`, `STORAGE_BACKEND`, `REDIS_URL` required in production
- `DEBUG = False` always in production settings

---

## 7. Naming Conventions

### Database (PostgreSQL)
| Concept | Convention | Example |
|---|---|---|
| Tables | `snake_case`, singular | `patient`, `lab_test`, `medicine_batch` |
| Columns | `snake_case` | `full_name`, `issued_at`, `blood_group` |
| Foreign keys | `<related_table>_id` | `patient_id`, `doctor_id`, `bill_id` |
| Junction tables | `<table1>_<table2>` | `user_role`, `role_permission`, `patient_emergency_contact` |
| Indexes | `idx_<table>_<columns>` | `idx_patient_mrn_active`, `idx_appt_doctor_date` |
| Enums | `SCREAMING_SNAKE_CASE` values | `HIGH_RISK`, `IN_PROGRESS`, `LIFE_THREATENING` |

### Django / Python
| Concept | Convention | Example |
|---|---|---|
| Models | `PascalCase`, singular | `Patient`, `LabTest`, `MedicineBatch` |
| Model fields | `snake_case` | `full_name`, `issued_at`, `blood_group` |
| Serializers | `<Model><Purpose>Serializer` | `PatientListSerializer`, `AppointmentWriteSerializer` |
| ViewSets | `<Model>ViewSet` | `PatientViewSet`, `AppointmentViewSet` |
| Services | `<action>_<entity>` function | `create_appointment()`, `soft_delete_patient()` |
| URL names | `<app>-<action>` | `patients-list`, `appointments-detail` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_ATTEMPTS`, `FIFO_BATCH_LOCK_TIMEOUT` |
| Test classes | `Test<Model><Scenario>` | `TestPatientSoftDelete`, `TestPharmacyFIFO` |

### API Fields
- Request/response JSON keys use `snake_case` (match Django model field names)
- Boolean fields prefixed with `is_` or `has_` where appropriate
- Timestamps always in ISO 8601 with UTC timezone: `2026-06-06T07:00:00Z`
- Monetary amounts in `NUMERIC(10,2)` — returned as strings in JSON to avoid float precision issues
- MRN format: `PT-XXXX-X` (patient), `NB-XXXX-XXX` (newborn)

---

## 8. Module Development Order

Build modules in this sequence to respect FK dependencies. Never build a module before its upstream dependencies are complete and tested.

```
Phase 0 — Foundation
  1.  core/                       # BaseModel, SoftDeleteModel, AuditModel, custom managers
  2.  auth_rbac/                  # User, Role, Permission, UserRole, RolePermission, UserSession
  3.  hospital_config/            # Hospital, Department

Phase 1 — Master Data
  4.  people/ (Patient, Staff, Doctor, EmergencyContact, Allergy)
  5.  pharmacy/ (Medicine, MedicineBatch only — no sales yet)

Phase 2 — Clinical Core
  6.  pregnancy/                  # Pregnancy, AncVisit, RiskEvent, Vaccination, WellnessPlan
  7.  appointments/               # Appointment
  8.  consultations/              # Consultation
  9.  prescriptions/              # Prescription, PrescriptionItem (after Medicine is ready)
  10. laboratory/                 # LabTest, LabReportFile

Phase 3 — Inpatient
  11. admissions/ (Bed, Admission, WardTransfer)
  12. delivery/                   # Delivery, DeliveryProcedure (after Admission)
  13. newborn/                    # Newborn, NewbornVaccination, NewbornFeedingLog, NewbornVital (after Delivery)

Phase 4 — Transactions
  14. pharmacy/ (PharmacySale, PharmacySaleItem — after Prescription and MedicineBatch)
  15. billing/                    # Bill, BillItem, BillPayment

Phase 5 — Operations
  16. hr/                         # Attendance, ShiftSchedule, LeaveRequest, Salary
  17. emergency/                  # EmergencyAlert
  18. notifications/              # Notification
  19. documents/                  # MedicalDocument

Phase 6 — System
  20. audit/                      # AuditLog (wired up via signals across all apps)
  21. reports/                    # Analytics aggregations (read-only, no new tables)
```

### Definition of Done per Module
- [ ] Model matches architecture document exactly (fields, constraints, FKs)
- [ ] Migration created and tested on clean DB
- [ ] SoftDeleteManager applied where required
- [ ] DRF serializers created (List, Detail, Write)
- [ ] ViewSet with RBAC permissions wired
- [ ] Service functions for all business operations
- [ ] Unit tests ≥ 80% coverage
- [ ] AuditLog entries written for all mutating operations
- [ ] API endpoints documented in OpenAPI schema

---

*MotherCare CLAUDE.md v1.0 — Engineering Reference Guide — Shakuntala Hospital*
