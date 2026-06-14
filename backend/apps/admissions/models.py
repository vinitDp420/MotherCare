"""
MotherCare — Admissions & Bed Management Models
"""
import uuid
from django.db import models
from django.utils import timezone
from core.models import BaseModel, SoftDeleteModel
from apps.admissions.constants import (
    WARD_TYPE_CHOICES,
    BED_STATUS_CHOICES,
    BED_STATUS_AVAILABLE,
    ADMISSION_STATUS_CHOICES,
    ADMISSION_STATUS_ACTIVE,
    ADMISSION_TYPE_CHOICES,
)

class Bed(BaseModel):
    """
    Physical bed master. Status is the real-time state of the bed.
    """
    bed_number = models.CharField(max_length=50, unique=True, help_text="Unique identifier for the bed.")
    ward_type = models.CharField(max_length=20, choices=WARD_TYPE_CHOICES, help_text="Type of ward.")
    status = models.CharField(
        max_length=20,
        choices=BED_STATUS_CHOICES,
        default=BED_STATUS_AVAILABLE,
        db_index=True,
        help_text="Real-time status of the bed."
    )
    floor = models.IntegerField(default=1, help_text="Floor number.")
    last_cleaned_at = models.DateTimeField(null=True, blank=True, help_text="When the bed was last cleaned.")
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "bed"
        ordering = ["bed_number"]

    def __str__(self) -> str:
        return f"Bed {self.bed_number} ({self.get_ward_type_display()})"


class Admission(SoftDeleteModel):
    """
    Patient inpatient record.
    """
    patient = models.ForeignKey("people.Patient", on_delete=models.RESTRICT, related_name="admissions")
    bed = models.ForeignKey(Bed, on_delete=models.RESTRICT, related_name="admissions")
    doctor = models.ForeignKey("people.Doctor", on_delete=models.RESTRICT, related_name="admissions")
    status = models.CharField(
        max_length=20,
        choices=ADMISSION_STATUS_CHOICES,
        default=ADMISSION_STATUS_ACTIVE,
        db_index=True,
        help_text="Clinical state of the admission."
    )
    admission_type = models.CharField(max_length=20, choices=ADMISSION_TYPE_CHOICES, help_text="Type of admission.")
    admitted_at = models.DateTimeField(default=timezone.now)
    est_discharge = models.DateTimeField(null=True, blank=True, help_text="Estimated discharge date and time.")
    actual_discharge = models.DateTimeField(null=True, blank=True, help_text="Actual discharge date and time.")
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "admission"
        ordering = ["-admitted_at"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(actual_discharge__isnull=True) | models.Q(actual_discharge__gt=models.F("admitted_at")),
                name="chk_admission_discharge_after_admitted"
            )
        ]

    def __str__(self) -> str:
        return f"Admission({self.patient_id}, Bed {self.bed.bed_number})"


class WardTransfer(BaseModel):
    """
    Movement history of a patient across beds within a single admission.
    """
    admission = models.ForeignKey(Admission, on_delete=models.CASCADE, related_name="transfers")
    from_bed = models.ForeignKey(Bed, on_delete=models.SET_NULL, null=True, blank=True, related_name="transfers_from")
    to_bed = models.ForeignKey(Bed, on_delete=models.RESTRICT, related_name="transfers_to")
    transferred_at = models.DateTimeField(default=timezone.now)
    reason = models.TextField(blank=True)
    transferred_by = models.ForeignKey("auth_rbac.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+")

    class Meta:
        db_table = "ward_transfer"
        ordering = ["-transferred_at"]

    def __str__(self) -> str:
        return f"Transfer({self.admission_id}, from={self.from_bed_id}, to={self.to_bed_id})"
