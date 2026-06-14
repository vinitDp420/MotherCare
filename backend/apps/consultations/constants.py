"""
MotherCare — Consultations Module Constants
Architecture: mothercare_final_architecture_v2.md — DOMAIN 6
"""
from __future__ import annotations

# ─────────────────────────────────────────────────────────────────────────────
# Consultation Status
# ─────────────────────────────────────────────────────────────────────────────
CONS_STATUS_IN_PROGRESS = "in_progress"
CONS_STATUS_COMPLETED = "completed"
CONS_STATUS_CANCELLED = "cancelled"

CONSULTATION_STATUS_CHOICES: list[tuple[str, str]] = [
    (CONS_STATUS_IN_PROGRESS, "In Progress"),
    (CONS_STATUS_COMPLETED, "Completed"),
    (CONS_STATUS_CANCELLED, "Cancelled"),
]

# Allowed transitions (BR-CONS-07: completed is effectively immutable)
CONSULTATION_STATUS_TRANSITIONS: dict[str, set[str]] = {
    CONS_STATUS_IN_PROGRESS: {CONS_STATUS_COMPLETED, CONS_STATUS_CANCELLED},
    CONS_STATUS_COMPLETED:   set(),   # Terminal
    CONS_STATUS_CANCELLED:   set(),   # Terminal
}

CONSULTATION_TERMINAL_STATUSES: set[str] = {CONS_STATUS_COMPLETED, CONS_STATUS_CANCELLED}
