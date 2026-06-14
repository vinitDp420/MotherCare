# MotherCare — Complete Architecture & Implementation Plan
## Shakuntala Hospital | Maternity Hospital Management System
**Analyzed:** 2026-06-06 | **Stack:** Django 4.2 · DRF 3.14 · PostgreSQL 15 · React 18  
**Source Documents:** PRD.md · CLAUDE.md · BUSINESS_RULES.md · DATABASE_ARCHITECTURE v2.0 · UI Screenshots (16)

---

## 1. Document Consistency Validation

### ✅ Consistent Across All Documents

| Area | Status | Notes |
|---|---|---|
| 49 MVP tables across 18 domains | ✅ Consistent | PRD, CLAUDE, Architecture all agree |
| Soft-delete on 7 clinical entities | ✅ Consistent | patient, pregnancy, appointment, consultation, admission, delivery, newborn |
| Prescription immutability | ✅ Consistent | All 3 docs enforce append-only |
| FIFO pharmacy dispensing | ✅ Consistent | `select_for_update` + ORDER BY expiry_date, purchase_date |
| MRN format `PT-XXXX-X` | ✅ Consistent | PRD, BUSINESS_RULES, Architecture agree |
| Baby MRN format `NB-YYYY-XXX` | ✅ Consistent | All docs agree |
| Token uniqueness (doctor + date + token) | ✅ Consistent | DB UNIQUE constraint confirmed |
| Token starts from 101 | ✅ Consistent | BUSINESS_RULES BR-APPT-03 |
| APGAR score 0–10 CHECK constraint | ✅ Consistent | DB + APP layer both enforce |
| Invoice format `INV-YYYY-NNNN` | ✅ Consistent | BR-BILL-11 and Architecture |
| Phase 2 entities excluded from MVP | ✅ Consistent | 8 entities deferred |
| AuditLog append-only | ✅ Consistent | All layers agree |

### ⚠️ Minor Inconsistencies Found

| # | Issue | Location | Resolution |
|---|---|---|---|
| 1 | PRD lists **"Reports & Analytics"** as module #16, but CLAUDE.md module order skips an explicit Reports app | PRD §8 vs CLAUDE.md §4 | Create a `reports/` app as a read-only analytics aggregation layer (no new tables) — CLAUDE.md §8 Step 21 covers this |
| 2 | PRD §4 lists **Financial Officer** role, but CLAUDE.md and Architecture do not explicitly define permissions for this role | PRD §4 | Add Financial Officer role with billing read/write permissions during RBAC seeding |
| 3 | PRD mentions **"Doctor"** as a sidebar nav item in the UI Screenshots but it is not an independent module in the module list | Dashboard screenshot | Doctors is a sub-view of People/Staff management — implement as a filtered staff directory view |
| 4 | BUSINESS_RULES BR-APPT-13 states doctor availability stored as `available_from` / `available_to` (TIME), but PRD APPT-06 says "next available slot" requires more sophisticated scheduling | BR-APPT-13 | MVP: use TIME fields for simple window check; Phase 2 upgrade to slot-based scheduling |
| 5 | Architecture lists `Delivery` has `patient_id` FK directly, but the relationship map says "Mother reached via Newborn → Delivery → Admission → Patient" | PART 1 DOMAIN 11 vs PART 7 | The direct `patient_id` on Delivery is a denormalization convenience — both are present and acceptable |
| 6 | PRD §7.3 says "49 tables" but the architecture PART 3 confirms exactly 49 — CLAUDE.md §1 says "49 tables, 18 domains" | All docs | ✅ Confirmed consistent — no conflict |

### ❌ Missing Requirements (Gaps)

| # | Gap | Impact | Recommendation |
|---|---|---|---|
| G-01 | **Password Reset / Forgot Password** — UI screenshot shows "Forgot Password?" link but no PRD requirement exists | AUTH module | Add `PasswordResetToken` endpoint (no new table needed; use email-based OTP flow, Phase 2 can add full table) |
| G-02 | **Doctor Availability Management UI** — PRD/CLAUDE mention `available_from`/`available_to` on Doctor model but no admin UI to manage it | Settings / People module | Add doctor availability edit within the Staff/Doctor profile management view |
| G-03 | **Session Expiry Duration** — No requirement defines how long sessions remain valid | AUTH-02 | Define: 8 hours active session, 30 days with "Remember Me". Must be in Settings |
| G-04 | **File Size Limit** for `MedicalDocument` and `LabReportFile` uploads | LAB-05, PAT-07 | Define max upload size (recommend 50 MB per file). Add to `constants.py` |
| G-05 | **Newborn MRN Generation Logic** — format `NB-YYYY-XXX` defined but no auto-generation rule documented | NB-02 | Auto-generate on newborn creation: year from `birth_datetime`, sequence reset annually |
| G-06 | **OTC Sale Invoice Number** — `PharmacySale.invoice_number` format not defined | PHAR-07 | Use `RX-YYYY-NNNN` to distinguish pharmacy invoices from billing invoices |
| G-07 | **Dashboard KPI refresh mechanism** — PRD NFR says KPIs load in 2 seconds, but polling vs WebSocket not specified | NFR §7.1 | MVP: polling every 30 seconds via React Query. Phase 2: WebSocket/SSE for live delivery feed |
| G-08 | **Leave Balance Tracking** — HR module has leave requests but no leave balance/entitlement entity | HR-04, HR-05 | MVP: track leave count via aggregating approved LeaveRequests per type per year; no new table |
| G-09 | **Discharge Summary document generation** — PRD mentions discharge summary as a `MedicalDocument` type but no generation flow is specified | ADM-03, PAT-07 | Add discharge summary PDF generation (similar to invoice PDF) when admission status → discharged |
| G-10 | **Search / Global Search bar** — Dashboard UI clearly shows a global search bar ("Search patients, doctors, or bills...") but no API requirement documents this | UI | Add `/api/v1/search/?q=` endpoint aggregating patients (MRN/name/phone), doctors, and bills |

---

## 2. Repository Structure

```
mothercare/                          ← Git root
├── backend/                         ← Django project root
│   ├── manage.py
│   ├── pyproject.toml               ← uv-managed dependencies
│   ├── .env.example
│   ├── .env                         ← gitignored
│   ├── .python-version              ← Python 3.11
│   ├── ruff.toml                    ← linter config
│   ├── pytest.ini
│   │
│   ├── config/                      ← Django settings package
│   │   ├── __init__.py
│   │   ├── settings/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py                  ← master URL router
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   ├── core/                        ← Shared abstractions
│   │   ├── __init__.py
│   │   ├── models.py                ← BaseModel, SoftDeleteModel, AuditModel
│   │   ├── managers.py              ← SoftDeleteManager
│   │   ├── permissions.py           ← DRF permission classes (HasModulePermission)
│   │   ├── pagination.py            ← StandardResultsPagination
│   │   ├── exceptions.py            ← BusinessRuleException, ConflictException
│   │   ├── utils.py                 ← MRN generator, invoice number generator
│   │   ├── constants.py             ← MAX_UPLOAD_SIZE, SESSION_DURATION, etc.
│   │   └── mixins.py               ← SoftDeleteMixin for ViewSets
│   │
│   ├── apps/
│   │   ├── auth_rbac/               ← Domain 1
│   │   ├── hospital_config/         ← Domain 2
│   │   ├── people/                  ← Domain 3
│   │   ├── pregnancy/               ← Domain 4
│   │   ├── appointments/            ← Domain 5
│   │   ├── consultations/           ← Domain 6
│   │   ├── prescriptions/           ← Domain 7
│   │   ├── laboratory/              ← Domain 8
│   │   ├── pharmacy/                ← Domain 9
│   │   ├── admissions/              ← Domain 10
│   │   ├── delivery/                ← Domain 11
│   │   ├── newborn/                 ← Domain 12
│   │   ├── billing/                 ← Domain 13
│   │   ├── hr/                      ← Domain 14
│   │   ├── emergency/               ← Domain 15
│   │   ├── notifications/           ← Domain 16
│   │   ├── documents/               ← Domain 17
│   │   ├── audit/                   ← Domain 18
│   │   └── reports/                 ← Read-only analytics (no new tables)
│   │
│   ├── media/                       ← Local dev file storage (gitignored)
│   └── staticfiles/                 ← Collected static files
│
├── frontend/                        ← React 18 (Vite) application
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.example
│   │
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── router.tsx               ← React Router v6 route definitions
│   │   │
│   │   ├── assets/                  ← Fonts, icons, brand images
│   │   ├── styles/                  ← Global CSS + design tokens
│   │   │   ├── globals.css
│   │   │   ├── tokens.css           ← CSS custom properties
│   │   │   └── typography.css
│   │   │
│   │   ├── components/              ← Reusable UI components
│   │   │   ├── ui/                  ← Primitive components (Button, Input, Badge, etc.)
│   │   │   ├── layout/              ← Sidebar, Topbar, PageWrapper
│   │   │   ├── forms/               ← FormField, DatePicker, SearchInput
│   │   │   └── shared/              ← PatientCard, AlertBadge, StatusChip
│   │   │
│   │   ├── modules/                 ← Feature modules (one per domain)
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── patients/
│   │   │   ├── pregnancy/
│   │   │   ├── appointments/
│   │   │   ├── consultations/
│   │   │   ├── prescriptions/
│   │   │   ├── laboratory/
│   │   │   ├── pharmacy/
│   │   │   ├── admissions/
│   │   │   ├── beds/
│   │   │   ├── delivery/
│   │   │   ├── newborn/
│   │   │   ├── billing/
│   │   │   ├── hr/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   │
│   │   ├── store/                   ← Zustand global state
│   │   │   ├── authStore.ts
│   │   │   └── uiStore.ts
│   │   │
│   │   ├── api/                     ← API client layer
│   │   │   ├── client.ts            ← Axios instance + interceptors
│   │   │   └── endpoints/           ← One file per domain
│   │   │
│   │   ├── hooks/                   ← Shared React Query hooks
│   │   ├── types/                   ← TypeScript type definitions
│   │   └── utils/                   ← Date formatters, MRN validators, etc.
│   │
│   └── public/
│
├── docs/                            ← Project documentation
│   ├── PRD.md
│   ├── CLAUDE.md
│   ├── BUSINESS_RULES.md
│   ├── mothercare_final_architecture_v2.md
│   ├── api/                         ← OpenAPI / Swagger specs (auto-generated)
│   └── adr/                         ← Architecture Decision Records
│
├── scripts/                         ← Dev utility scripts
│   ├── seed_data.py                 ← Hospital config, roles, permissions seed
│   ├── create_dev_users.py
│   └── generate_mrn.py
│
├── .github/
│   └── workflows/
│       ├── ci.yml                   ← Lint + test on push
│       └── deploy.yml               ← Production deploy (Phase 2)
│
├── docker-compose.yml               ← PostgreSQL + Redis for local dev
├── Dockerfile                       ← Backend production image
├── .gitignore
└── README.md
```

---

## 3. Backend Folder Structure (Per Django App)

Every app under `apps/` follows this standard layout:

```
apps/<domain>/
├── __init__.py
├── models.py          ← DB schema (matches architecture doc exactly)
├── constants.py       ← Domain-specific enums and magic values
├── serializers.py     ← ListSerializer, DetailSerializer, WriteSerializer per model
├── services.py        ← All business logic functions
├── views.py           ← ViewSets (orchestration only)
├── urls.py            ← Router registration
├── permissions.py     ← Domain-specific permission overrides (if any)
├── signals.py         ← AuditLog writes, status transitions via signals
├── admin.py           ← Django admin registration
├── apps.py            ← AppConfig
├── migrations/
│   ├── __init__.py
│   └── 0001_initial.py
└── tests/
    ├── __init__.py
    ├── test_models.py
    ├── test_serializers.py
    ├── test_services.py
    ├── test_views.py
    └── factories.py   ← factory_boy factories for this domain
```

### Key Backend Modules Detail

#### `core/` — Foundation Layer
```
core/
├── models.py
│   ├── class BaseModel(Model)        ← id (UUID), created_at, updated_at, created_by
│   ├── class SoftDeleteModel(Base)   ← + is_deleted, deleted_at
│   └── class AuditModel(Base)        ← alias for BaseModel (all 49 tables inherit)
├── managers.py
│   └── class SoftDeleteManager       ← filters is_deleted=False by default
├── permissions.py
│   ├── class IsAuthenticatedStaff    ← base check
│   ├── class HasModulePermission     ← checks Role→Permission chain
│   └── class IsReadOnly              ← GET-only for CMO/reports
├── exceptions.py
│   ├── BusinessRuleError             ← HTTP 422
│   └── ConflictError                 ← HTTP 409
└── utils.py
    ├── generate_mrn()                ← PT-XXXX-A format
    ├── generate_baby_mrn()           ← NB-YYYY-XXX format
    ├── generate_invoice_number()     ← INV-YYYY-NNNN format
    └── generate_token_number()       ← Sequential per doctor per day
```

#### `apps/auth_rbac/` — Authentication & RBAC
```
Models: User, Role, Permission, UserRole, RolePermission, UserSession
Key services:
  - login_user(username, password, ip, user_agent) → UserSession
  - logout_user(session_token) → void
  - revoke_session(session_id, reason) → void
  - assign_role(user_id, role_id) → UserRole
  - check_permission(user_id, module, action) → bool
API endpoints:
  POST /api/v1/auth/login/
  POST /api/v1/auth/logout/
  GET  /api/v1/auth/me/
  POST /api/v1/auth/password-reset/
  GET  /api/v1/auth/sessions/
  DELETE /api/v1/auth/sessions/{id}/
```

#### `apps/people/` — Patient & Staff
```
Models: Patient, EmergencyContact, PatientEmergencyContact,
        PatientAllergy, Staff, Doctor
Key services:
  - register_patient(data) → Patient (generates MRN)
  - soft_delete_patient(patient_id, user_id) → void
  - check_allergies(patient_id, generic_name) → AllergyAlert | None
  - search_patients(query) → QuerySet  [MRN exact, name trigram, phone exact]
API endpoints:
  GET/POST   /api/v1/patients/
  GET/PATCH  /api/v1/patients/{id}/
  DELETE     /api/v1/patients/{id}/     [soft delete only]
  GET/POST   /api/v1/patients/{id}/allergies/
  GET/POST   /api/v1/patients/{id}/emergency-contacts/
  GET/POST   /api/v1/patients/{id}/documents/
  GET/POST   /api/v1/staff/
  GET/POST   /api/v1/doctors/
```

#### `apps/pharmacy/` — FIFO Dispensing (Critical Path)
```
Models: Medicine, MedicineBatch, PharmacySale, PharmacySaleItem
Key services:
  - dispense_prescription(prescription_id, sold_by) → PharmacySale
    → FIFO batch selection with select_for_update()
    → wrapped in transaction.atomic()
    → quantity decremented via F('quantity') - qty
  - process_otc_sale(patient_id, items, sold_by) → PharmacySale
  - check_low_stock() → list[Medicine]
  - check_near_expiry(days=30) → list[MedicineBatch]
```

#### `apps/audit/` — Immutable Audit Trail
```
Model: AuditLog
Wired via signals.py in every other app
Signal receiver: post_save, post_delete on all major models
  → writes INSERT to audit_log (never UPDATE or DELETE)
  → captures old_value / new_value as JSONB snapshots
```

---

## 4. Frontend Architecture

### Technology Choices (Frontend)

| Tool | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5 | Build tool + dev server |
| TypeScript | 5 | Type safety |
| React Router | 6 | Client-side routing |
| TanStack Query | 5 | Server state management + caching |
| Zustand | 4 | Client state (auth, UI) |
| Axios | 1.6 | HTTP client |
| React Hook Form | 7 | Form state + validation |
| Zod | 3 | Schema validation (pairs with RHF) |
| Recharts | 2 | Charts (patient growth, revenue, delivery stats) |
| date-fns | 3 | Date manipulation |
| Lucide React | Latest | Icon system |

### Frontend Folder Structure

```
frontend/src/
│
├── main.tsx                       ← React 18 entry point
├── App.tsx                        ← Root component, theme provider
├── router.tsx                     ← All route definitions (React Router v6)
│
├── styles/
│   ├── globals.css                ← CSS reset + base styles
│   ├── tokens.css                 ← Design tokens (colors, spacing, typography)
│   └── typography.css             ← Font imports (Inter from Google Fonts)
│
├── assets/
│   ├── logo.svg
│   ├── logo-dark.svg
│   └── illustrations/             ← Login page illustration (maternity theme)
│
├── types/                         ← TypeScript interfaces (mirror backend models)
│   ├── auth.types.ts
│   ├── patient.types.ts
│   ├── appointment.types.ts
│   ├── consultation.types.ts
│   ├── prescription.types.ts
│   ├── lab.types.ts
│   ├── pharmacy.types.ts
│   ├── admission.types.ts
│   ├── delivery.types.ts
│   ├── newborn.types.ts
│   ├── billing.types.ts
│   ├── hr.types.ts
│   └── common.types.ts            ← Paginated<T>, ApiError, Audit fields
│
├── api/
│   ├── client.ts                  ← Axios instance, auth header injection,
│   │                                 401 redirect, error normalization
│   └── endpoints/
│       ├── auth.api.ts
│       ├── patients.api.ts
│       ├── pregnancy.api.ts
│       ├── appointments.api.ts
│       ├── consultations.api.ts
│       ├── prescriptions.api.ts
│       ├── lab.api.ts
│       ├── pharmacy.api.ts
│       ├── admissions.api.ts
│       ├── beds.api.ts
│       ├── delivery.api.ts
│       ├── newborn.api.ts
│       ├── billing.api.ts
│       ├── hr.api.ts
│       ├── reports.api.ts
│       └── settings.api.ts
│
├── store/
│   ├── authStore.ts               ← user, token, roles, permissions
│   └── uiStore.ts                 ← sidebar collapsed, theme, active module
│
├── hooks/                         ← Shared React Query hooks
│   ├── useAuth.ts
│   ├── usePatients.ts
│   ├── useAppointments.ts
│   ├── useBeds.ts
│   ├── usePermission.ts           ← usePermission(module, action) → bool
│   └── useDashboard.ts
│
├── utils/
│   ├── formatters.ts              ← formatDate, formatCurrency, formatMRN
│   ├── validators.ts              ← MRN regex, phone regex
│   ├── permissions.ts             ← Client-side permission helpers (display only)
│   └── constants.ts
│
├── components/                    ← Reusable, stateless UI primitives
│   │
│   ├── ui/                        ← Atomic design system components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx              ← Status badges (Normal, High Risk, STAT, etc.)
│   │   ├── Modal.tsx
│   │   ├── Drawer.tsx
│   │   ├── DataTable.tsx          ← Reusable paginated table
│   │   ├── Tabs.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Avatar.tsx
│   │   ├── Skeleton.tsx           ← Loading state placeholders
│   │   └── Toast.tsx              ← Notification toasts
│   │
│   ├── layout/
│   │   ├── AppLayout.tsx          ← Sidebar + Topbar + content area wrapper
│   │   ├── Sidebar.tsx            ← Role-aware navigation (hides inaccessible modules)
│   │   ├── Topbar.tsx             ← Global search, notifications, user menu
│   │   ├── PageHeader.tsx         ← Breadcrumb + page title + action buttons
│   │   └── AuthLayout.tsx         ← Login page layout (split panel)
│   │
│   ├── forms/
│   │   ├── FormField.tsx          ← Label + Input + error message
│   │   ├── DatePicker.tsx
│   │   ├── TimePicker.tsx
│   │   ├── SearchInput.tsx        ← Debounced patient/medicine search
│   │   ├── FileUpload.tsx         ← Drag & drop file upload (lab reports, documents)
│   │   └── PhoneInput.tsx
│   │
│   └── shared/
│       ├── PatientCard.tsx        ← Patient roster row card
│       ├── PatientSidePanel.tsx   ← Right-panel patient summary (used in consultations)
│       ├── RiskBadge.tsx          ← Normal / High Risk / Critical with color coding
│       ├── StatusChip.tsx         ← Generic status badge with lifecycle colors
│       ├── AllergyAlert.tsx       ← Blocking/non-blocking allergy warning modal
│       ├── KPICard.tsx            ← Dashboard metric card with trend indicator
│       ├── ActivityFeedItem.tsx   ← Recent activity feed row
│       └── BedStatusCard.tsx      ← Individual bed status tile
│
└── modules/                       ← Feature modules (one folder per UI module)
    │
    ├── auth/
    │   ├── LoginPage.tsx
    │   ├── ForgotPasswordPage.tsx
    │   └── components/
    │       └── LoginForm.tsx
    │
    ├── dashboard/
    │   ├── DashboardPage.tsx
    │   └── components/
    │       ├── KPIStrip.tsx       ← Total Patients, Today's Appts, Current Admits, etc.
    │       ├── PatientGrowthChart.tsx
    │       ├── QuickActions.tsx   ← Register Patient, Book Appt, Admit Patient, Generate Bill
    │       ├── RecentActivityFeed.tsx
    │       └── DeliveryFeedWidget.tsx
    │
    ├── patients/
    │   ├── PatientsPage.tsx       ← Patient roster with filters
    │   ├── PatientDetailPage.tsx  ← Full patient profile
    │   ├── RegisterPatientPage.tsx
    │   └── components/
    │       ├── PatientRoster.tsx
    │       ├── PatientFilters.tsx ← All / High Risk / 3rd Trimester
    │       ├── PatientProfile.tsx
    │       ├── AllergySection.tsx
    │       ├── EmergencyContactSection.tsx
    │       └── DocumentsSection.tsx
    │
    ├── pregnancy/
    │   ├── PregnancyTrackingPage.tsx
    │   └── components/
    │       ├── TrimesterTimeline.tsx
    │       ├── ANCVisitTimeline.tsx
    │       ├── LatestVitalsPanel.tsx
    │       ├── ClinicalLogsTable.tsx
    │       ├── WellnessPlanSection.tsx
    │       └── VaccinationTracker.tsx
    │
    ├── appointments/
    │   ├── AppointmentsPage.tsx   ← List view (default) + Calendar toggle
    │   ├── BookAppointmentPage.tsx
    │   └── components/
    │       ├── AppointmentList.tsx
    │       ├── AppointmentCalendar.tsx
    │       ├── DoctorAvailabilityPanel.tsx
    │       ├── TokenAssignment.tsx
    │       └── AppointmentStatusBadge.tsx
    │
    ├── consultations/
    │   ├── ConsultationWorkspacePage.tsx
    │   └── components/
    │       ├── ClinicalNotesEditor.tsx
    │       ├── PrescriptionPanel.tsx  ← Inline prescription entry
    │       ├── LabOrderPanel.tsx
    │       ├── PreviousRxHistory.tsx
    │       ├── PatientSummaryPanel.tsx ← Allergies, conditions, pregnancy status
    │       └── FollowUpScheduler.tsx
    │
    ├── prescriptions/
    │   ├── PrescriptionsPage.tsx  ← Patient prescription history
    │   └── components/
    │       ├── PrescriptionDetail.tsx
    │       ├── MedicineSearch.tsx ← Formulary search with allergy check
    │       └── PrescriptionPrintView.tsx
    │
    ├── laboratory/
    │   ├── LaboratoryPage.tsx     ← Lab management dashboard
    │   └── components/
    │       ├── PendingTestQueue.tsx   ← Sorted STAT→Urgent→Routine
    │       ├── LabTestDetail.tsx
    │       ├── ReportUpload.tsx
    │       ├── FlaggedResultsSection.tsx
    │       └── OrderLabTestModal.tsx
    │
    ├── pharmacy/
    │   ├── PharmacyPage.tsx
    │   └── components/
    │       ├── InventoryTable.tsx
    │       ├── BatchManagement.tsx
    │       ├── PendingPrescriptionsQueue.tsx
    │       ├── DispenseModal.tsx
    │       ├── OTCSaleForm.tsx
    │       ├── LowStockAlerts.tsx
    │       └── NearExpiryAlerts.tsx
    │
    ├── admissions/
    │   ├── AdmissionsPage.tsx
    │   └── components/
    │       ├── AdmissionIntakeForm.tsx
    │       ├── ActiveAdmissionsList.tsx
    │       ├── WardTransferModal.tsx
    │       ├── TransferHistoryTimeline.tsx
    │       └── EmergencyAdmissionShortcut.tsx
    │
    ├── beds/
    │   ├── BedManagementPage.tsx
    │   └── components/
    │       ├── BedStatusBoard.tsx
    │       ├── WardOccupancyCard.tsx  ← General, Private, Labor, NICU, ICU
    │       └── BedStatusLegend.tsx
    │
    ├── delivery/
    │   ├── DeliveryManagementPage.tsx
    │   └── components/
    │       ├── LiveDeliveryFeed.tsx
    │       ├── RecordDeliveryForm.tsx
    │       ├── DeliveryProcedureLog.tsx
    │       ├── DeliveryKPIStrip.tsx   ← High-risk flag count
    │       └── DeliveryDetail.tsx
    │
    ├── newborn/
    │   ├── NewbornManagementPage.tsx
    │   ├── NewbornDetailPage.tsx
    │   └── components/
    │       ├── NewbornRegistry.tsx
    │       ├── NICUStatusBadge.tsx
    │       ├── VaccinationChecklist.tsx
    │       ├── FeedingLogTable.tsx
    │       ├── VitalsTracker.tsx
    │       └── GrowthTrendChart.tsx   ← Weight + head circumference over time
    │
    ├── billing/
    │   ├── BillingPage.tsx
    │   ├── BillDetailPage.tsx
    │   └── components/
    │       ├── BillingDashboard.tsx   ← Today's revenue, pending, insurance claims
    │       ├── BillList.tsx
    │       ├── CreateBillForm.tsx
    │       ├── BillItemsTable.tsx
    │       ├── PaymentModal.tsx       ← Partial payment support
    │       ├── QuickBillingShortcuts.tsx
    │       └── InvoicePrintView.tsx   ← PDF generation
    │
    ├── hr/
    │   ├── HRPage.tsx
    │   └── components/
    │       ├── StaffDirectory.tsx
    │       ├── AttendanceTracker.tsx
    │       ├── ShiftScheduleGrid.tsx
    │       ├── LeaveRequestTable.tsx
    │       ├── LeaveApprovalModal.tsx
    │       └── PayrollTable.tsx
    │
    ├── reports/
    │   ├── ReportsPage.tsx
    │   └── components/
    │       ├── PatientGrowthReport.tsx
    │       ├── AppointmentCompletionReport.tsx
    │       ├── RevenueReport.tsx
    │       └── DeliveryStatsReport.tsx
    │
    └── settings/
        ├── SettingsPage.tsx
        └── components/
            ├── HospitalProfileForm.tsx
            ├── UserManagementTable.tsx
            ├── RolePermissionsMatrix.tsx
            ├── LocalizationSettings.tsx
            ├── SecuritySettings.tsx       ← 2FA toggle, session duration
            └── BackupSettings.tsx
```

---

## 5. Module Dependency Graph

### Backend Build Order (FK dependency chain)

```
LAYER 0 — Foundation (no dependencies)
┌─────────────┐
│    core/    │  BaseModel, SoftDeleteModel, managers, permissions, utils
└──────┬──────┘
       │
LAYER 1 — Identity & Config
       ├──► auth_rbac/         (User, Role, Permission, UserRole, RolePermission, UserSession)
       └──► hospital_config/   (Hospital, Department ← Staff)

LAYER 2 — Master Data  ← depends on auth_rbac, hospital_config
       ├──► people/            (Patient, Staff ← User+Dept, Doctor ← Staff,
       │                        EmergencyContact, PatientEmergencyContact, PatientAllergy)
       └──► pharmacy/ [PARTIAL] (Medicine, MedicineBatch — formulary only, no sales yet)

LAYER 3 — Clinical Core  ← depends on people, pharmacy
       ├──► pregnancy/         (Pregnancy ← Patient+Doctor, AncVisit, RiskEvent,
       │                        Vaccination, WellnessPlan)
       ├──► appointments/      (Appointment ← Patient+Doctor)
       ├──► consultations/     (Consultation ← Appointment)
       ├──► prescriptions/     (Prescription ← Consultation, PrescriptionItem ← Medicine)
       └──► laboratory/        (LabTest ← Patient+Doctor+Consultation, LabReportFile)

LAYER 4 — Inpatient  ← depends on people
       ├──► admissions/        (Bed, Admission ← Patient+Doctor+Bed, WardTransfer)
       ├──► delivery/          (Delivery ← Admission+Patient+Doctor, DeliveryProcedure)
       └──► newborn/           (Newborn ← Delivery, NewbornVaccination,
                                 NewbornFeedingLog, NewbornVital)

LAYER 5 — Transactions  ← depends on prescriptions + pharmacy[PARTIAL] + admissions
       ├──► pharmacy/ [COMPLETE] (PharmacySale ← Prescription+Patient, PharmacySaleItem ← MedicineBatch)
       └──► billing/           (Bill ← Patient+Admission, BillItem, BillPayment)

LAYER 6 — Operations  ← depends on people (staff)
       ├──► hr/                (Attendance, ShiftSchedule, LeaveRequest, Salary ← Staff)
       ├──► emergency/         (EmergencyAlert ← Patient+Doctor+Admission)
       ├──► notifications/     (Notification ← User+Patient)
       └──► documents/         (MedicalDocument ← Patient)

LAYER 7 — System  ← depends on all
       ├──► audit/             (AuditLog — wired via signals to all apps)
       └──► reports/           (Read-only aggregations — no migrations)
```

### Frontend Module Dependencies

```
AuthStore (Zustand)
  └──► All modules (gate via PrivateRoute + usePermission hook)

Router
  ├── /login               → auth/LoginPage
  ├── /dashboard           → dashboard/DashboardPage
  │     └── depends on: patients, appointments, beds, delivery, billing (KPIs only)
  ├── /patients            → patients/PatientsPage
  │     └── /patients/:id/pregnancy → pregnancy/PregnancyTrackingPage
  ├── /appointments        → appointments/AppointmentsPage
  │     └── depends on: patients (search), doctors (availability)
  ├── /consultations/:id   → consultations/ConsultationWorkspacePage
  │     └── depends on: prescriptions (history), laboratory (recent results), patients (allergy)
  ├── /laboratory          → laboratory/LaboratoryPage
  ├── /pharmacy            → pharmacy/PharmacyPage
  │     └── depends on: prescriptions (pending queue)
  ├── /admissions          → admissions/AdmissionsPage
  │     └── depends on: beds (availability), patients (search)
  ├── /beds                → beds/BedManagementPage
  ├── /delivery            → delivery/DeliveryManagementPage
  │     └── depends on: admissions (active), newborn (register prompt)
  ├── /newborn             → newborn/NewbornManagementPage
  │     └── depends on: delivery (parent record)
  ├── /billing             → billing/BillingPage
  │     └── depends on: patients (search), admissions (link)
  ├── /hr                  → hr/HRPage
  │     └── depends on: people/staff (directory)
  ├── /reports             → reports/ReportsPage
  └── /settings            → settings/SettingsPage
        └── depends on: auth_rbac (user management, roles, permissions)
```

---

## 6. Development Roadmap (Solo Developer)

### Estimated Timeline: ~20 Weeks (5 Months)

> **Assumptions:** Solo developer, 6–8 productive hours/day, 5 days/week.
> Week = 5 working days. Each sprint = 2 weeks.

### Pre-Sprint: Environment Setup (Days 1–3)

- [ ] Initialize Git repository with `main` + `develop` branches
- [ ] Set up `docker-compose.yml` (PostgreSQL 15 + Redis)
- [ ] Initialize Django project with `uv` + `pyproject.toml`
- [ ] Initialize React/Vite/TypeScript frontend
- [ ] Configure `ruff`, `pytest`, `.env` structure
- [ ] Set up GitHub Actions CI (lint + test on push)

---

## 7. Sprint Plan (10 Sprints × 2 Weeks = 20 Weeks)

### Sprint 1 — Foundation & Auth (Weeks 1–2)
**Backend**
- [ ] `core/` — BaseModel, SoftDeleteModel, AuditModel, SoftDeleteManager
- [ ] `core/` — permissions.py, exceptions.py, utils.py (MRN, invoice generators)
- [ ] `auth_rbac/` — User, Role, Permission, UserRole, RolePermission, UserSession models
- [ ] `auth_rbac/` — Login service (Argon2id verify, SHA-256 session token), logout, revoke
- [ ] `auth_rbac/` — DRF Token Auth wired to UserSession model
- [ ] `hospital_config/` — Hospital singleton, Department models
- [ ] Seed script: default hospital (Shakuntala), all roles, all permissions
- [ ] Tests: login/logout, session expiry, role assignment (≥80% coverage)

**Frontend**
- [ ] Vite + React 18 + TypeScript + React Router 6 setup
- [ ] Design tokens CSS (colors, spacing, typography matching UI screenshots)
- [ ] AuthLayout + LoginPage with split-panel design
- [ ] Zustand authStore (token, user, roles, permissions)
- [ ] Axios client with auth header injection + 401 redirect
- [ ] PrivateRoute wrapper + role-aware Sidebar

---

### Sprint 2 — Patient Management (Weeks 3–4)
**Backend**
- [ ] `people/` — Patient, EmergencyContact, PatientEmergencyContact models
- [ ] `people/` — PatientAllergy model with severity enum
- [ ] `people/` — Staff, Doctor models (available_from, available_to TIME fields)
- [ ] Patient services: `register_patient()`, `soft_delete_patient()`, `search_patients()` (trigram)
- [ ] Allergy service: `check_allergies(patient_id, generic_name)`
- [ ] PostgreSQL `pg_trgm` extension + trigram index on `full_name`
- [ ] API: `/api/v1/patients/` CRUD + search + soft delete
- [ ] API: `/api/v1/patients/{id}/allergies/` + `/api/v1/patients/{id}/emergency-contacts/`
- [ ] Tests: MRN uniqueness, soft delete cascade rules, allergy check

**Frontend**
- [ ] AppLayout (Sidebar + Topbar + PageWrapper)
- [ ] PatientsPage — roster with filter (All / High Risk / 3rd Trimester)
- [ ] PatientProfile sidebar panel
- [ ] RegisterPatientPage form (RHF + Zod validation)
- [ ] AllergySection, EmergencyContactSection
- [ ] Global search bar in Topbar (patient MRN/name/phone)

---

### Sprint 3 — Pregnancy Tracking (Weeks 5–6)
**Backend**
- [ ] `pregnancy/` — Pregnancy, AncVisit, PregnancyRiskEvent, Vaccination, WellnessPlan models
- [ ] Pregnancy services: `create_pregnancy()`, gestational week + trimester calculator
- [ ] ANC visit services: `record_anc_visit()`, vitals validation (BP, FHR, glucose)
- [ ] Wellness plan services: `create_wellness_plan()`, `update_wellness_plan()`
- [ ] API: `/api/v1/pregnancies/` + nested sub-resources
- [ ] Tests: EDD/LMP validation, trimester calculation, risk event log

**Frontend**
- [ ] PregnancyTrackingPage (matching UI screenshot exactly)
- [ ] TrimesterTimeline component (milestone markers M1–M9)
- [ ] ANCVisitTimeline (chronological visit list)
- [ ] LatestVitalsPanel (BP, weight, FHR, glucose cards)
- [ ] WellnessPlanSection (dietary guidance, daily precautions)
- [ ] VaccinationTracker (due/administered/skipped checklist)

---

### Sprint 4 — Appointments & Consultations (Weeks 7–8)
**Backend**
- [ ] `appointments/` — Appointment model + status lifecycle enforcer
- [ ] Token auto-assignment service: `assign_token(doctor_id, date)` → sequential from 101
- [ ] Status transition service (one-directional enforcement)
- [ ] `consultations/` — Consultation model + status lifecycle
- [ ] Consultation creation service (validates appointment status is confirmed/in_progress)
- [ ] Auto-advance appointment to `in_progress` when consultation created
- [ ] Follow-up appointment creation from consultation
- [ ] API: `/api/v1/appointments/` (list, calendar, book, cancel)
- [ ] API: `/api/v1/consultations/` (create, notes update, complete)
- [ ] Tests: token uniqueness, status transitions, double booking prevention

**Frontend**
- [ ] AppointmentsPage with list + calendar toggle
- [ ] BookAppointmentPage form
- [ ] DoctorAvailabilityPanel
- [ ] ConsultationWorkspacePage (3-panel layout)
- [ ] PatientSummaryPanel (allergies, pregnancy status, chronic conditions)
- [ ] ClinicalNotesEditor
- [ ] PreviousRxHistory panel
- [ ] FollowUpScheduler modal

---

### Sprint 5 — Prescriptions & Laboratory (Weeks 9–10)
**Backend**
- [ ] `prescriptions/` — Prescription + PrescriptionItem (immutability enforcement in save())
- [ ] Allergy check integration at PrescriptionItem creation
- [ ] Drug-allergy blocking alert (severe/life_threatening) vs warning (mild/moderate)
- [ ] `laboratory/` — LabTest + LabReportFile (append-only enforcement)
- [ ] Lab status lifecycle service
- [ ] Flagged result notification trigger
- [ ] File upload service (PDF/JPG/PNG/DICOM validation)
- [ ] API: `/api/v1/prescriptions/` (create only, no update/delete)
- [ ] API: `/api/v1/laboratory/` (order test, update status, upload report)
- [ ] Tests: prescription immutability, STAT queue ordering, append-only files

**Frontend**
- [ ] PrescriptionPanel in consultation workspace (medicine formulary search)
- [ ] AllergyAlert modal (blocking for severe, non-blocking warning for mild)
- [ ] PrescriptionsPage — patient prescription history
- [ ] LaboratoryPage — pending queue (STAT→Urgent→Routine ordering)
- [ ] ReportUpload drag-and-drop component
- [ ] FlaggedResultsSection + dashboard alert integration

---

### Sprint 6 — Admissions & Bed Management (Weeks 11–12)
**Backend**
- [ ] `admissions/` — Bed, Admission, WardTransfer models
- [ ] Admission service: `admit_patient()` — validates no active admission, bed available → atomic bed status change
- [ ] Ward transfer service: atomic 5-step transaction (BR-ADM-09)
- [ ] Discharge service: `discharge_patient()` → bed status → `cleaning`
- [ ] Emergency admission shortcut (BR-ADM-13)
- [ ] API: `/api/v1/admissions/`, `/api/v1/beds/`
- [ ] Tests: concurrent admission prevention, bed status state machine, ward transfer transaction

**Frontend**
- [ ] AdmissionsPage — active admissions list + intake form (matching screenshot)
- [ ] BedManagementPage — status board (General, Private, Labor, NICU, ICU)
- [ ] WardOccupancyCard per ward type with occupancy percentage
- [ ] WardTransferModal (5-step visual)
- [ ] EmergencyAdmissionShortcut button
- [ ] BedStatusBoard with color-coded status tiles

---

### Sprint 7 — Delivery & Newborn (Weeks 13–14)
**Backend**
- [ ] `delivery/` — Delivery + DeliveryProcedure models
- [ ] Delivery creation service: validates active admission, enforces UNIQUE constraint
- [ ] C-section procedure mandatory rule enforcement (BR-DEL-06)
- [ ] `newborn/` — Newborn (with APGAR CHECK constraints), NewbornVaccination, NewbornFeedingLog, NewbornVital
- [ ] Baby MRN auto-generation: `NB-YYYY-XXX` format
- [ ] NICU routing trigger on `condition = 'nicu_required'`
- [ ] Feeding log service (append-only, volume required for non-breast feeds)
- [ ] API: `/api/v1/delivery/`, `/api/v1/newborns/`
- [ ] Tests: delivery prerequisites, APGAR validation, multi-baby twins support

**Frontend**
- [ ] DeliveryManagementPage — live delivery feed widget
- [ ] RecordDeliveryForm (mode, vitals, complications)
- [ ] DeliveryProcedureLog
- [ ] NewbornManagementPage — active newborn registry
- [ ] NewbornDetailPage (vaccinations, feeding logs, vitals, growth chart)
- [ ] GrowthTrendChart (weight + head circumference over time using Recharts)
- [ ] NICU status badge + alert

---

### Sprint 8 — Pharmacy & Billing (Weeks 15–16)
**Backend**
- [x] `pharmacy/ [COMPLETE]` — PharmacySale, PharmacySaleItem
- [x] FIFO dispensing service with `select_for_update()` + `transaction.atomic()`
- [x] F() expression for atomic quantity decrement
- [x] OTC sale processing
- [x] Low-stock + near-expiry alert services (configurable 30-day window)
- [x] Prescription one-time dispensing enforcement (BR-RX-08)
- [x] `billing/` — Bill, BillItem, BillPayment
- [x] Invoice number generator: `INV-YYYY-NNNN` sequential per year
- [x] Payment status derivation logic (paid/partial/pending/overdue/refunded)
- [x] `amount_paid` recalculation on every BillPayment creation
- [x] API: `/api/v1/pharmacy/`, `/api/v1/billing/`
- [x] Tests: FIFO ordering, concurrent dispensing (race condition test), overpayment prevention

**Frontend**
- [ ] PharmacyPage (inventory table + pending prescriptions queue)
- [ ] DispenseModal (FIFO batch selection display)
- [ ] OTCSaleForm
- [ ] LowStockAlerts + NearExpiryAlerts dashboard widgets
- [ ] BillingPage — dashboard with today's revenue, pending payments, insurance KPIs
- [ ] CreateBillForm with BillItemsTable
- [ ] PaymentModal (partial payment, multiple methods)
- [ ] InvoicePrintView (PDF-ready print layout)
- [ ] QuickBillingShortcuts (Consultation / Lab / Pharmacy / Admission)

---

### Sprint 9 — HR, Emergency, Notifications, Documents, Audit Logs (Weeks 17–18)
**Backend**
- [/] `hr/` — Attendance, ShiftSchedule, LeaveRequest, Salary models
- [/] `Salary.net_pay` computed in model save method to align SQLite and PostgreSQL
- [/] Leave approval workflow service (pending → approved/rejected/cancelled)
- [/] `emergency/` — EmergencyAlert with status lifecycle + response time calculation
- [/] `notifications/` — Notification model + email/SMS channel (MVP: email + SMS)
- [/] `documents/` — MedicalDocument file upload service
- [/] `audit/` — AuditLog model + implementing log_event to save logs in db
- [/] API: `/api/v1/hr/`, `/api/v1/emergency/`, `/api/v1/notifications/`, `/api/v1/documents/`, `/api/v1/audit/`
- [/] Tests: leave approval workflow, emergency alert lifecycle, audit log immutability

**Frontend**
- [ ] HRPage — staff directory, attendance, shift schedule, leave requests, payroll
- [ ] LeaveApprovalModal
- [ ] Emergency alert indicator in Recent Activity feed (red priority badge)
- [ ] DocumentsSection on patient profile
- [ ] FileUpload component (reuse for lab reports + medical documents)
- [ ] NotificationBell in Topbar

---

### Sprint 10 — Reports, Settings, Polish & Testing (Weeks 19–20)
**Backend**
- [ ] `reports/` — read-only analytics endpoints (no new migrations)
  - Patient growth by month
  - Appointment completion rate
  - Revenue by period
  - Delivery statistics (mode breakdown, high-risk count)
- [ ] `/api/v1/search/` global search endpoint
- [ ] Discharge summary PDF generation
- [ ] `/api/v1/settings/` — hospital profile, user management, role permissions matrix
- [ ] OpenAPI schema generation (drf-spectacular)
- [ ] Performance: query optimization, `select_related`/`prefetch_related` audit
- [ ] Security: RBAC penetration testing (ensure no client-side-only gating)
- [ ] End-to-end test of full maternity workflow: Register → Pregnancy → Appt → Consult → Rx → Admit → Deliver → Newborn → Bill

**Frontend**
- [ ] ReportsPage — 4 report types with Recharts visualizations
- [ ] SettingsPage — hospital profile, user management, role permissions matrix
- [ ] RolePermissionsMatrix (visual permission grid)
- [ ] Language toggle (English/Marathi) — i18n setup
- [ ] Dashboard live delivery feed (polling every 30s)
- [ ] Responsive design audit (tablet support)
- [ ] Accessibility audit (ARIA labels, keyboard navigation)
- [ ] Performance audit (lazy loading, route splitting)

---

## 8. Definition of Done (Per Sprint)

Each sprint is complete when:
- [ ] All model migrations pass on a clean PostgreSQL database
- [ ] All service functions have ≥80% test coverage (pytest + pytest-django)
- [ ] All API endpoints return correct HTTP status codes (200/201/204/400/409/422)
- [ ] AuditLog entries written for all mutating operations
- [ ] Corresponding frontend module renders correctly with real API data
- [ ] No N+1 queries (verified via Django Debug Toolbar in dev)
- [ ] Ruff linter passes with zero errors

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| FIFO pharmacy concurrency bugs | Medium | High | Write dedicated concurrent test with threading; use `select_for_update()` strictly |
| Prescription immutability bypass | Low | Critical | Enforce in model `save()` + serializer validate() + DB trigger as belt-and-suspenders |
| Soft delete filter forgetting | Medium | High | Custom SoftDeleteManager is the default manager; write test that verifies deleted records are invisible |
| AuditLog signal misfiring | Medium | Medium | Integration test every signal path; test that audit entries appear for all 7 action types |
| File storage migration (local → S3) | Low | Medium | Abstract file storage behind Django's Storage API from day 1 |
| Performance: trigram search slow | Low | Medium | `pg_trgm` extension + GIN index on patient.full_name (defined in architecture) |
| Token uniqueness race condition | Low | High | DB UNIQUE constraint is the final guard; application pre-check is UX only |

---

*MotherCare Implementation Plan v1.0 — Analyzed by Antigravity — 2026-06-06*
