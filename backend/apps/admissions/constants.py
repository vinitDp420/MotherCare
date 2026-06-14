"""
MotherCare — Admissions & Bed Management Constants
"""

# Ward Types
WARD_TYPE_GENERAL = "general"
WARD_TYPE_PRIVATE = "private"
WARD_TYPE_LABOR = "labor"
WARD_TYPE_NICU = "nicu"
WARD_TYPE_ICU = "icu"

WARD_TYPE_CHOICES = [
    (WARD_TYPE_GENERAL, "General"),
    (WARD_TYPE_PRIVATE, "Private"),
    (WARD_TYPE_LABOR, "Labor"),
    (WARD_TYPE_NICU, "NICU"),
    (WARD_TYPE_ICU, "ICU"),
]

# Bed Statuses
BED_STATUS_AVAILABLE = "available"
BED_STATUS_OCCUPIED = "occupied"
BED_STATUS_CLEANING = "cleaning"
BED_STATUS_MAINTENANCE = "maintenance"
BED_STATUS_RESERVED = "reserved"

BED_STATUS_CHOICES = [
    (BED_STATUS_AVAILABLE, "Available"),
    (BED_STATUS_OCCUPIED, "Occupied"),
    (BED_STATUS_CLEANING, "Cleaning"),
    (BED_STATUS_MAINTENANCE, "Maintenance"),
    (BED_STATUS_RESERVED, "Reserved"),
]

# Admission Statuses
ADMISSION_STATUS_ACTIVE = "active"
ADMISSION_STATUS_DISCHARGE_PENDING = "discharge_pending"
ADMISSION_STATUS_DISCHARGED = "discharged"
ADMISSION_STATUS_TRANSFERRED = "transferred"
ADMISSION_STATUS_DECEASED = "deceased"

ADMISSION_STATUS_CHOICES = [
    (ADMISSION_STATUS_ACTIVE, "Active"),
    (ADMISSION_STATUS_DISCHARGE_PENDING, "Discharge Pending"),
    (ADMISSION_STATUS_DISCHARGED, "Discharged"),
    (ADMISSION_STATUS_TRANSFERRED, "Transferred"),
    (ADMISSION_STATUS_DECEASED, "Deceased"),
]

# Admission Types
ADMISSION_TYPE_MATERNITY = "maternity"
ADMISSION_TYPE_POST_NATAL = "post_natal"
ADMISSION_TYPE_EMERGENCY = "emergency"
ADMISSION_TYPE_SURGERY = "surgery"

ADMISSION_TYPE_CHOICES = [
    (ADMISSION_TYPE_MATERNITY, "Maternity"),
    (ADMISSION_TYPE_POST_NATAL, "Post Natal"),
    (ADMISSION_TYPE_EMERGENCY, "Emergency"),
    (ADMISSION_TYPE_SURGERY, "Surgery"),
]
