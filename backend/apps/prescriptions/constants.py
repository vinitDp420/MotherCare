"""
MotherCare — Prescriptions Module Constants
Architecture: mothercare_final_architecture_v2.md — DOMAIN 7

Frequency and duration choices for PrescriptionItem.
"""
from __future__ import annotations

# ─────────────────────────────────────────────────────────────────────────────
# Frequency choices
# ─────────────────────────────────────────────────────────────────────────────
FREQ_OD = "OD"
FREQ_BD = "BD"
FREQ_TDS = "TDS"
FREQ_QID = "QID"
FREQ_SOS = "SOS"
FREQ_STAT = "STAT"
FREQ_WEEKLY = "weekly"

FREQUENCY_CHOICES: list[tuple[str, str]] = [
    (FREQ_OD, "Once Daily (OD)"),
    (FREQ_BD, "Twice Daily (BD)"),
    (FREQ_TDS, "Three Times Daily (TDS)"),
    (FREQ_QID, "Four Times Daily (QID)"),
    (FREQ_SOS, "As Needed (SOS)"),
    (FREQ_STAT, "Immediately (STAT)"),
    (FREQ_WEEKLY, "Weekly"),
]

# ─────────────────────────────────────────────────────────────────────────────
# Duration choices
# ─────────────────────────────────────────────────────────────────────────────
DURATION_CHOICES: list[tuple[str, str]] = [
    ("1 day", "1 Day"),
    ("3 days", "3 Days"),
    ("5 days", "5 Days"),
    ("7 days", "7 Days"),
    ("10 days", "10 Days"),
    ("14 days", "14 Days"),
    ("21 days", "21 Days"),
    ("28 days", "28 Days"),
    ("30 days", "30 Days"),
    ("45 days", "45 Days"),
    ("60 days", "60 Days"),
    ("ongoing", "Ongoing / Chronic"),
]
