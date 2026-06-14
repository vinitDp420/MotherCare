"""
MotherCare — Hospital Configuration Models (Domain 2)
Architecture: mothercare_final_architecture_v2.md — DOMAIN 2

Entities:
    Hospital    — Single-row institutional master
    Department  — Clinical and administrative departments

These are prerequisite models for the People module (Staff.department FK).
"""
from django.db import models

from core.models import BaseModel


# ─────────────────────────────────────────────────────────────────────────────
# Hospital — Single-row institutional master
# Architecture: id, name, code, address, city, state, pincode, phone, email,
#               timezone, locale, logo_url
# ─────────────────────────────────────────────────────────────────────────────
class Hospital(BaseModel):
    """
    Single-row institutional configuration master.
    Hospital code: SH-MAT-2024 (Shakuntala Hospital, New Delhi).
    CLAUDE.md: Never hard-code hospital ID — always read from Hospital singleton.
    """

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    timezone = models.CharField(max_length=50, default="Asia/Kolkata")
    locale = models.CharField(max_length=20, default="en-IN")
    logo_url = models.URLField(blank=True)

    class Meta:
        db_table = "hospital"
        verbose_name = "Hospital"
        verbose_name_plural = "Hospitals"

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


# ─────────────────────────────────────────────────────────────────────────────
# Department — Clinical and administrative departments
# Architecture: id, name, department_type, head_staff_id → staff (nullable), is_active
# Values: Obstetrics, Pediatrics, Nursing, Admin, Laboratory, Pharmacy, ICU, HR
# ─────────────────────────────────────────────────────────────────────────────
DEPARTMENT_TYPE_CHOICES = [
    ("Obstetrics", "Obstetrics"),
    ("Pediatrics", "Pediatrics"),
    ("Nursing", "Nursing"),
    ("Admin", "Admin"),
    ("Laboratory", "Laboratory"),
    ("Pharmacy", "Pharmacy"),
    ("ICU", "ICU"),
    ("HR", "HR"),
    ("Other", "Other"),
]


class Department(BaseModel):
    """
    Hospital department entity.
    Used by Staff for department assignment.
    head_staff_id is a string ref to avoid circular FK with Staff.
    """

    name = models.CharField(max_length=200, unique=True)
    department_type = models.CharField(
        max_length=50,
        choices=DEPARTMENT_TYPE_CHOICES,
        default="Other",
    )
    # String reference to avoid circular import with people app
    head_staff = models.ForeignKey(
        "people.Staff",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="headed_departments",
        help_text="Department head (optional, nullable).",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "department"
        verbose_name = "Department"
        verbose_name_plural = "Departments"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
