"""
MotherCare — Laboratory Module Constants
Architecture: mothercare_final_architecture_v2.md — DOMAIN 8
"""
from __future__ import annotations

# ─────────────────────────────────────────────────────────────────────────────
# Urgency
# ─────────────────────────────────────────────────────────────────────────────
URGENCY_STAT = "stat"
URGENCY_URGENT = "urgent"
URGENCY_ROUTINE = "routine"

URGENCY_CHOICES: list[tuple[str, str]] = [
    (URGENCY_STAT, "STAT (Immediate)"),
    (URGENCY_URGENT, "Urgent"),
    (URGENCY_ROUTINE, "Routine"),
]

# Priority order for queue (lower number = higher priority)
URGENCY_PRIORITY: dict[str, int] = {
    URGENCY_STAT: 0,
    URGENCY_URGENT: 1,
    URGENCY_ROUTINE: 2,
}

# ─────────────────────────────────────────────────────────────────────────────
# Status
# ─────────────────────────────────────────────────────────────────────────────
STATUS_PENDING = "pending"
STATUS_IN_PROGRESS = "in_progress"
STATUS_COMPLETED = "completed"
STATUS_CANCELLED = "cancelled"
STATUS_CRITICAL = "critical"

LAB_STATUS_CHOICES: list[tuple[str, str]] = [
    (STATUS_PENDING, "Pending"),
    (STATUS_IN_PROGRESS, "In Progress"),
    (STATUS_COMPLETED, "Completed"),
    (STATUS_CANCELLED, "Cancelled"),
    (STATUS_CRITICAL, "Critical"),
]

# One-directional status transitions (no reversals)
LAB_STATUS_TRANSITIONS: dict[str, set[str]] = {
    STATUS_PENDING:     {STATUS_IN_PROGRESS, STATUS_CANCELLED},
    STATUS_IN_PROGRESS: {STATUS_COMPLETED, STATUS_CANCELLED, STATUS_CRITICAL},
    STATUS_COMPLETED:   set(),   # Terminal
    STATUS_CANCELLED:   set(),   # Terminal
    STATUS_CRITICAL:    set(),   # Terminal
}

TERMINAL_LAB_STATUSES: set[str] = {STATUS_COMPLETED, STATUS_CANCELLED, STATUS_CRITICAL}

# ─────────────────────────────────────────────────────────────────────────────
# Report File Types
# ─────────────────────────────────────────────────────────────────────────────
FILE_TYPE_PDF = "pdf"
FILE_TYPE_JPG = "jpg"
FILE_TYPE_PNG = "png"
FILE_TYPE_DICOM = "dicom"

FILE_TYPE_CHOICES: list[tuple[str, str]] = [
    (FILE_TYPE_PDF, "PDF"),
    (FILE_TYPE_JPG, "JPEG Image"),
    (FILE_TYPE_PNG, "PNG Image"),
    (FILE_TYPE_DICOM, "DICOM"),
]

# ─────────────────────────────────────────────────────────────────────────────
# Test Types (Maternal / OB-GYN common tests)
# ─────────────────────────────────────────────────────────────────────────────
TEST_TYPE_CHOICES: list[tuple[str, str]] = [
    ("cbc", "Complete Blood Count (CBC)"),
    ("blood_group", "Blood Group & Rh Typing"),
    ("hba1c", "HbA1c"),
    ("glucose_fasting", "Fasting Glucose"),
    ("glucose_pp", "Post-Prandial Glucose"),
    ("ogtt", "OGTT (Oral Glucose Tolerance)"),
    ("urine_routine", "Urine Routine"),
    ("urine_culture", "Urine Culture & Sensitivity"),
    ("thyroid", "Thyroid Function (TSH/T3/T4)"),
    ("liver_function", "Liver Function Test (LFT)"),
    ("kidney_function", "Kidney Function Test (KFT)"),
    ("serum_ferritin", "Serum Ferritin"),
    ("vitamin_d", "Vitamin D (25-OH)"),
    ("vdrl", "VDRL/RPR"),
    ("hiv", "HIV Screening"),
    ("hbsag", "HBsAg"),
    ("hcv", "HCV Antibody"),
    ("torch", "TORCH Panel"),
    ("anomaly_scan", "Anomaly Scan (USG)"),
    ("nt_scan", "NT Scan (Nuchal Translucency)"),
    ("growth_scan", "Growth Scan (USG)"),
    ("doppler", "Doppler Study"),
    ("other", "Other"),
]
