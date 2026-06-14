"""
MotherCare — Appointments Module Constants
Architecture: mothercare_final_architecture_v2.md — DOMAIN 5

Enums / Choices for Appointment entity.

Business Rules:
    BR-APPT-03: Tokens start at 101, auto-assigned per doctor per day
    BR-APPT-05: appointment_type values
    BR-APPT-07: Status lifecycle one-directional
"""
from __future__ import annotations

# ─────────────────────────────────────────────────────────────────────────────
# Appointment Type
# ─────────────────────────────────────────────────────────────────────────────
APPT_TYPE_NEW_PATIENT = "new_patient"
APPT_TYPE_FOLLOW_UP = "follow_up"
APPT_TYPE_ANC = "anc"
APPT_TYPE_EMERGENCY = "emergency"
APPT_TYPE_SCAN = "scan"
APPT_TYPE_LAB_REVIEW = "lab_review"
APPT_TYPE_GDM_SCREEN = "gdm_screen"
APPT_TYPE_ULTRASOUND = "ultrasound"

APPOINTMENT_TYPE_CHOICES: list[tuple[str, str]] = [
    (APPT_TYPE_NEW_PATIENT, "New Patient"),
    (APPT_TYPE_FOLLOW_UP, "Follow-up"),
    (APPT_TYPE_ANC, "Antenatal Care (ANC)"),
    (APPT_TYPE_EMERGENCY, "Emergency"),
    (APPT_TYPE_SCAN, "Scan"),
    (APPT_TYPE_LAB_REVIEW, "Lab Review"),
    (APPT_TYPE_GDM_SCREEN, "GDM Screening"),
    (APPT_TYPE_ULTRASOUND, "Ultrasound"),
]

# ─────────────────────────────────────────────────────────────────────────────
# Appointment Status
# ─────────────────────────────────────────────────────────────────────────────
STATUS_SCHEDULED = "scheduled"
STATUS_CONFIRMED = "confirmed"
STATUS_IN_PROGRESS = "in_progress"
STATUS_COMPLETED = "completed"
STATUS_CANCELLED = "cancelled"
STATUS_NO_SHOW = "no_show"

APPOINTMENT_STATUS_CHOICES: list[tuple[str, str]] = [
    (STATUS_SCHEDULED, "Scheduled"),
    (STATUS_CONFIRMED, "Confirmed"),
    (STATUS_IN_PROGRESS, "In Progress"),
    (STATUS_COMPLETED, "Completed"),
    (STATUS_CANCELLED, "Cancelled"),
    (STATUS_NO_SHOW, "No Show"),
]

# Allowed forward transitions (BR-APPT-07: one-directional)
ALLOWED_STATUS_TRANSITIONS: dict[str, set[str]] = {
    STATUS_SCHEDULED:   {STATUS_CONFIRMED, STATUS_CANCELLED, STATUS_NO_SHOW},
    STATUS_CONFIRMED:   {STATUS_IN_PROGRESS, STATUS_CANCELLED, STATUS_NO_SHOW},
    STATUS_IN_PROGRESS: {STATUS_COMPLETED, STATUS_CANCELLED},
    STATUS_COMPLETED:   set(),   # Terminal — no further transitions
    STATUS_CANCELLED:   set(),   # Terminal — no further transitions
    STATUS_NO_SHOW:     set(),   # Terminal — no further transitions
}

# Terminal statuses — cannot be modified once in these states
TERMINAL_STATUSES: set[str] = {STATUS_COMPLETED, STATUS_CANCELLED, STATUS_NO_SHOW}

# ─────────────────────────────────────────────────────────────────────────────
# Token configuration (BR-APPT-03)
# ─────────────────────────────────────────────────────────────────────────────
TOKEN_START = 101  # Tokens start at 101 per doctor per day
TOKEN_MAX = 999    # Upper bound for safety
