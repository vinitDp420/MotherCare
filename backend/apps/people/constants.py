"""
MotherCare — People Module Constants
Architecture: mothercare_final_architecture_v2.md — DOMAIN 3

All enum values for Patient, Staff, Doctor, EmergencyContact, Allergy entities.
"""

# ─────────────────────────────────────────────────────────────────────────────
# Blood Group
# ─────────────────────────────────────────────────────────────────────────────
BLOOD_GROUP_A_POS = "A+"
BLOOD_GROUP_A_NEG = "A-"
BLOOD_GROUP_B_POS = "B+"
BLOOD_GROUP_B_NEG = "B-"
BLOOD_GROUP_AB_POS = "AB+"
BLOOD_GROUP_AB_NEG = "AB-"
BLOOD_GROUP_O_POS = "O+"
BLOOD_GROUP_O_NEG = "O-"
BLOOD_GROUP_UNKNOWN = "UNKNOWN"

BLOOD_GROUP_CHOICES = [
    (BLOOD_GROUP_A_POS, "A+"),
    (BLOOD_GROUP_A_NEG, "A-"),
    (BLOOD_GROUP_B_POS, "B+"),
    (BLOOD_GROUP_B_NEG, "B-"),
    (BLOOD_GROUP_AB_POS, "AB+"),
    (BLOOD_GROUP_AB_NEG, "AB-"),
    (BLOOD_GROUP_O_POS, "O+"),
    (BLOOD_GROUP_O_NEG, "O-"),
    (BLOOD_GROUP_UNKNOWN, "Unknown"),
]

# ─────────────────────────────────────────────────────────────────────────────
# Allergy Severity — BR-PAT-13
# ─────────────────────────────────────────────────────────────────────────────
ALLERGY_SEVERITY_MILD = "mild"
ALLERGY_SEVERITY_MODERATE = "moderate"
ALLERGY_SEVERITY_SEVERE = "severe"
ALLERGY_SEVERITY_LIFE_THREATENING = "life_threatening"

ALLERGY_SEVERITY_CHOICES = [
    (ALLERGY_SEVERITY_MILD, "Mild"),
    (ALLERGY_SEVERITY_MODERATE, "Moderate"),
    (ALLERGY_SEVERITY_SEVERE, "Severe"),
    (ALLERGY_SEVERITY_LIFE_THREATENING, "Life Threatening"),
]

# Severities that require a blocking alert at prescription time (BR-RX-05)
BLOCKING_ALLERGY_SEVERITIES = {ALLERGY_SEVERITY_SEVERE, ALLERGY_SEVERITY_LIFE_THREATENING}

# ─────────────────────────────────────────────────────────────────────────────
# Emergency Contact Relationship Types — Architecture DOMAIN 3
# ─────────────────────────────────────────────────────────────────────────────
RELATIONSHIP_SPOUSE = "spouse"
RELATIONSHIP_PARENT = "parent"
RELATIONSHIP_SIBLING = "sibling"
RELATIONSHIP_CHILD = "child"
RELATIONSHIP_GUARDIAN = "guardian"
RELATIONSHIP_FRIEND = "friend"
RELATIONSHIP_OTHER = "other"

RELATIONSHIP_TYPE_CHOICES = [
    (RELATIONSHIP_SPOUSE, "Spouse"),
    (RELATIONSHIP_PARENT, "Parent"),
    (RELATIONSHIP_SIBLING, "Sibling"),
    (RELATIONSHIP_CHILD, "Child"),
    (RELATIONSHIP_GUARDIAN, "Guardian"),
    (RELATIONSHIP_FRIEND, "Friend"),
    (RELATIONSHIP_OTHER, "Other"),
]

# ─────────────────────────────────────────────────────────────────────────────
# Staff Designation Examples (open-ended, not an enum in DB)
# ─────────────────────────────────────────────────────────────────────────────
MAX_PHONE_LENGTH = 20
MAX_NAME_LENGTH = 255
MAX_DESIGNATION_LENGTH = 100
MAX_SPECIALISATION_LENGTH = 200
MAX_REGISTRATION_NO_LENGTH = 50
MAX_MRN_LENGTH = 20
MAX_ALLERGEN_LENGTH = 200
MAX_REACTION_TYPE_LENGTH = 200
