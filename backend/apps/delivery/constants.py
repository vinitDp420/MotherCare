"""
MotherCare — Delivery Module Constants
"""

DELIVERY_MODE_NORMAL = "normal"
DELIVERY_MODE_C_SECTION = "c_section"
DELIVERY_MODE_ASSISTED = "assisted"
DELIVERY_MODE_WATER_BIRTH = "water_birth"

DELIVERY_MODE_CHOICES = [
    (DELIVERY_MODE_NORMAL, "Normal"),
    (DELIVERY_MODE_C_SECTION, "C-Section"),
    (DELIVERY_MODE_ASSISTED, "Assisted"),
    (DELIVERY_MODE_WATER_BIRTH, "Water Birth"),
]
