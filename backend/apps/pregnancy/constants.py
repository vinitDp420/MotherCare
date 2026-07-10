"""
MotherCare — Pregnancy Module Constants
Architecture: mothercare_final_architecture_v2.md — DOMAIN 4

Enums / Choices for Pregnancy, AncVisit, Vaccination, PregnancyRiskEvent.
"""
from __future__ import annotations

# ─────────────────────────────────────────────────────────────────────────────
# Pregnancy
# ─────────────────────────────────────────────────────────────────────────────
RISK_STATUS_NORMAL = "normal"
RISK_STATUS_HIGH = "high_risk"
RISK_STATUS_CRITICAL = "critical"

RISK_STATUS_CHOICES: list[tuple[str, str]] = [
    (RISK_STATUS_NORMAL, "Normal"),
    (RISK_STATUS_HIGH, "High Risk"),
    (RISK_STATUS_CRITICAL, "Critical"),
]

TRIMESTER_1 = 1
TRIMESTER_2 = 2
TRIMESTER_3 = 3

TRIMESTER_CHOICES: list[tuple[int, str]] = [
    (TRIMESTER_1, "First Trimester (Weeks 1–13)"),
    (TRIMESTER_2, "Second Trimester (Weeks 14–27)"),
    (TRIMESTER_3, "Third Trimester (Weeks 28–42)"),
]

# Week boundaries for trimester calculation
TRIMESTER_1_MAX_WEEK = 13
TRIMESTER_2_MAX_WEEK = 27

GESTATIONAL_WEEK_MIN = 1
GESTATIONAL_WEEK_MAX = 45  # DB CHECK constraint

# ─────────────────────────────────────────────────────────────────────────────
# ANC Visit
# ─────────────────────────────────────────────────────────────────────────────
VISIT_TYPE_ROUTINE = "routine"
VISIT_TYPE_EMERGENCY = "emergency"
VISIT_TYPE_FOLLOW_UP = "follow_up"
VISIT_TYPE_GDM_SCREEN = "gdm_screen"
VISIT_TYPE_ULTRASOUND = "ultrasound"
VISIT_TYPE_LAB_REVIEW = "lab_review"

VISIT_TYPE_CHOICES: list[tuple[str, str]] = [
    (VISIT_TYPE_ROUTINE, "Routine ANC"),
    (VISIT_TYPE_EMERGENCY, "Emergency"),
    (VISIT_TYPE_FOLLOW_UP, "Follow-up"),
    (VISIT_TYPE_GDM_SCREEN, "GDM Screening"),
    (VISIT_TYPE_ULTRASOUND, "Ultrasound"),
    (VISIT_TYPE_LAB_REVIEW, "Lab Review"),
]

# ─────────────────────────────────────────────────────────────────────────────
# Vaccination Status
# ─────────────────────────────────────────────────────────────────────────────
VACC_STATUS_DUE = "due"
VACC_STATUS_ADMINISTERED = "administered"
VACC_STATUS_NOT_REQUIRED = "not_required"
VACC_STATUS_SKIPPED = "skipped"

VACCINATION_STATUS_CHOICES: list[tuple[str, str]] = [
    (VACC_STATUS_DUE, "Due"),
    (VACC_STATUS_ADMINISTERED, "Administered"),
    (VACC_STATUS_NOT_REQUIRED, "Not Required"),
    (VACC_STATUS_SKIPPED, "Skipped"),
]

# Standard maternal vaccines for MotherCare Hospital
STANDARD_MATERNAL_VACCINES: list[dict] = [
    {"name": "TT (Tetanus Toxoid) Dose 1", "due_week_start": 16, "due_week_end": 20},
    {"name": "TT (Tetanus Toxoid) Dose 2", "due_week_start": 20, "due_week_end": 28},
    {"name": "Influenza", "due_week_start": 12, "due_week_end": 24},
    {"name": "Hepatitis B Dose 1", "due_week_start": 1, "due_week_end": 12},
    {"name": "Hepatitis B Dose 2", "due_week_start": 13, "due_week_end": 24},
]

# ─────────────────────────────────────────────────────────────────────────────
# Pregnancy Risk Event — Risk Level
# ─────────────────────────────────────────────────────────────────────────────
EVENT_RISK_LOW = "low"
EVENT_RISK_MODERATE = "moderate"
EVENT_RISK_HIGH = "high"
EVENT_RISK_CRITICAL = "critical"

RISK_EVENT_LEVEL_CHOICES: list[tuple[str, str]] = [
    (EVENT_RISK_LOW, "Low"),
    (EVENT_RISK_MODERATE, "Moderate"),
    (EVENT_RISK_HIGH, "High"),
    (EVENT_RISK_CRITICAL, "Critical"),
]

# ─────────────────────────────────────────────────────────────────────────────
# Vital field constraints (for validation)
# ─────────────────────────────────────────────────────────────────────────────
BP_SYSTOLIC_MIN = 60
BP_SYSTOLIC_MAX = 200
BP_DIASTOLIC_MIN = 40
BP_DIASTOLIC_MAX = 140
WEIGHT_KG_MIN = 30
WEIGHT_KG_MAX = 200
FHR_BPM_MIN = 60
FHR_BPM_MAX = 200
GLUCOSE_MGDL_MIN = 40
GLUCOSE_MGDL_MAX = 600
