"""
MotherCare — Global Constants
No magic numbers in application code — all constants defined here.
CLAUDE.md §3 General: "No magic numbers — define constants in a module-level constants.py per app"
This file contains system-wide constants shared across all apps.
"""

# ─────────────────────────────────────────────────────────────────────────────
# File Upload
# ─────────────────────────────────────────────────────────────────────────────
MAX_UPLOAD_SIZE_BYTES = 52_428_800  # 50 MB (G-04 gap resolution)
ALLOWED_LAB_REPORT_TYPES = ["pdf", "jpg", "jpeg", "png", "dicom"]
ALLOWED_DOCUMENT_TYPES = ["pdf", "jpg", "jpeg", "png", "docx", "dicom"]

# ─────────────────────────────────────────────────────────────────────────────
# Session / Authentication
# ─────────────────────────────────────────────────────────────────────────────
SESSION_TOKEN_LENGTH = 32         # bytes (256-bit secure random)
DEFAULT_SESSION_EXPIRY_HOURS = 8  # Standard session (G-03 gap resolution)
REMEMBER_ME_EXPIRY_HOURS = 720    # 30 days with "Remember Me"

# ─────────────────────────────────────────────────────────────────────────────
# Pharmacy
# ─────────────────────────────────────────────────────────────────────────────
NEAR_EXPIRY_DAYS_DEFAULT = 30     # Alert window for near-expiry medicine batches (PHAR-05)
FIFO_BATCH_LOCK_TIMEOUT = 5       # Seconds to wait for SELECT FOR UPDATE lock

# ─────────────────────────────────────────────────────────────────────────────
# Appointments
# ─────────────────────────────────────────────────────────────────────────────
TOKEN_NUMBER_START = 101          # First token of the day per doctor (BR-APPT-03)
NO_SHOW_GRACE_PERIOD_MINUTES = 15 # Grace period before marking as no_show (BR-APPT-10)

# ─────────────────────────────────────────────────────────────────────────────
# Laboratory
# ─────────────────────────────────────────────────────────────────────────────
MAX_LAB_REPORT_FILES_PER_TEST = 10  # Sanity cap on file uploads per test

# ─────────────────────────────────────────────────────────────────────────────
# MRN / Identifier Formats
# ─────────────────────────────────────────────────────────────────────────────
PATIENT_MRN_PREFIX = "PT"         # PT-XXXX-A
BABY_MRN_PREFIX = "NB"            # NB-YYYY-XXX
INVOICE_PREFIX = "INV"            # INV-YYYY-NNNN
PHARMACY_INVOICE_PREFIX = "RX"    # RX-YYYY-NNNN (G-06 gap resolution)

# ─────────────────────────────────────────────────────────────────────────────
# Billing
# ─────────────────────────────────────────────────────────────────────────────
INVOICE_SEQ_PADDING = 4           # INV-2024-0001 → 4 digits zero-padded
BABY_MRN_SEQ_PADDING = 3          # NB-2024-042 → 3 digits zero-padded

# ─────────────────────────────────────────────────────────────────────────────
# Allergy Severity (used by allergy alert logic)
# ─────────────────────────────────────────────────────────────────────────────
BLOCKING_ALLERGY_SEVERITIES = ["severe", "life_threatening"]  # BR-RX-05: blocking alert
WARNING_ALLERGY_SEVERITIES = ["mild", "moderate"]              # BR-RX-06: non-blocking warning

# ─────────────────────────────────────────────────────────────────────────────
# Delivery
# ─────────────────────────────────────────────────────────────────────────────
PPH_NORMAL_DELIVERY_THRESHOLD_ML = 500    # Blood loss >500ml in normal delivery = high risk flag (BR-DEL-07)
PPH_CSECTION_THRESHOLD_ML = 1000          # Blood loss >1000ml in C-section = high risk flag (BR-DEL-07)

# ─────────────────────────────────────────────────────────────────────────────
# Dashboard Polling (G-07 gap resolution)
# ─────────────────────────────────────────────────────────────────────────────
DASHBOARD_KPI_CACHE_SECONDS = 30   # KPI data cached for 30 seconds
DELIVERY_FEED_POLL_INTERVAL_MS = 30_000  # 30 seconds polling in MVP (Phase 2: WebSocket)
