"""
MotherCare — Newborn Module Constants
"""

# Newborn Gender Choices
GENDER_MALE = "M"
GENDER_FEMALE = "F"
GENDER_OTHER = "O"
GENDER_UNDETERMINED = "U"

NEWBORN_GENDER_CHOICES = [
    (GENDER_MALE, "Male"),
    (GENDER_FEMALE, "Female"),
    (GENDER_OTHER, "Other"),
    (GENDER_UNDETERMINED, "Undetermined"),
]

# Clinical Condition Choices
CONDITION_HEALTHY = "healthy"
CONDITION_NICU_REQUIRED = "nicu_required"
CONDITION_DECEASED = "deceased"
CONDITION_TRANSFERRED = "transferred"

NEWBORN_CONDITION_CHOICES = [
    (CONDITION_HEALTHY, "Healthy"),
    (CONDITION_NICU_REQUIRED, "NICU Required"),
    (CONDITION_DECEASED, "Deceased"),
    (CONDITION_TRANSFERRED, "Transferred"),
]

# Feed Type Choices
FEED_BREAST = "breast"
FEED_FORMULA = "formula"
FEED_NG_TUBE = "ng_tube"
FEED_IV = "iv"

FEED_TYPE_CHOICES = [
    (FEED_BREAST, "Breast"),
    (FEED_FORMULA, "Formula"),
    (FEED_NG_TUBE, "NG Tube"),
    (FEED_IV, "IV"),
]

# Vaccine Status Choices
VACCINE_STATUS_DUE = "due"
VACCINE_STATUS_ADMINISTERED = "administered"
VACCINE_STATUS_NOT_REQUIRED = "not_required"
VACCINE_STATUS_SKIPPED = "skipped"

VACCINE_STATUS_CHOICES = [
    (VACCINE_STATUS_DUE, "Due"),
    (VACCINE_STATUS_ADMINISTERED, "Administered"),
    (VACCINE_STATUS_NOT_REQUIRED, "Not Required"),
    (VACCINE_STATUS_SKIPPED, "Skipped"),
]
