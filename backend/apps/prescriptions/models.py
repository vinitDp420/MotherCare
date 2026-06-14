"""
MotherCare — Prescriptions Module Models
Architecture: mothercare_final_architecture_v2.md — DOMAIN 7

Models: Prescription, PrescriptionItem

Business Rules:
    BR-RX-01: Prescription is IMMUTABLE — no UPDATE or DELETE ever
    BR-RX-02: Prescription must belong to a Consultation AND Patient
    BR-RX-03: PrescriptionItem references Medicine by FK — no free text
    BR-RX-04: append-only: every new prescription/item = new row

Both models inherit BaseModel (NOT SoftDeleteModel — immutable, never deleted).
"""
from __future__ import annotations

from django.db import models
from django.utils import timezone

from apps.prescriptions.constants import FREQUENCY_CHOICES
from core.models import BaseModel


class Prescription(BaseModel):
    """
    Immutable prescription header per consultation.

    Architecture constraints:
        - FK consultation (RESTRICT) — consultation cannot be deleted if prescription exists
        - FK patient (RESTRICT) — immutable reference
        - No UPDATE or DELETE (BR-RX-01) — enforced at service and view layer

    Previous prescriptions are retrieved by:
        Prescription.objects.filter(patient=patient).order_by('-issued_at')
    No junction table required.
    """

    consultation = models.ForeignKey(
        "consultations.Consultation",
        on_delete=models.RESTRICT,
        related_name="prescriptions",
        help_text="Source consultation. RESTRICT: cannot delete consultation that has prescriptions.",
    )
    patient = models.ForeignKey(
        "people.Patient",
        on_delete=models.RESTRICT,
        related_name="prescriptions",
        help_text="Patient this prescription belongs to. Denormalised from consultation.",
    )
    issued_at = models.DateTimeField(
        default=timezone.now,
        help_text="Timestamp when prescription was issued (typically when consultation completes).",
    )
    notes = models.TextField(
        blank=True,
        help_text="General notes for the prescription (e.g. special instructions, pharmacist notes).",
    )

    class Meta:
        db_table = "prescription"
        verbose_name = "Prescription"
        verbose_name_plural = "Prescriptions"
        ordering = ["-issued_at"]
        indexes = [
            models.Index(fields=["patient", "issued_at"], name="idx_rx_patient_issued"),
            models.Index(fields=["consultation"], name="idx_rx_consultation"),
        ]

    def __str__(self) -> str:
        return f"Rx({self.patient_id}, {self.issued_at:%Y-%m-%d})"

    @property
    def item_count(self) -> int:
        """Number of medicine items in this prescription."""
        return self.items.count()


class PrescriptionItem(BaseModel):
    """
    Line items for each prescription. References Medicine by FK — no free text.

    Enables drug-interaction alerts, formulary compliance, and dispensing reconciliation.

    Business Rules:
        BR-RX-03: FK to Medicine — never allow free-text drug entry
        BR-RX-04: Inherits immutability from parent Prescription
    """

    prescription = models.ForeignKey(
        Prescription,
        on_delete=models.CASCADE,
        related_name="items",
        help_text="Parent prescription. CASCADE: items deleted if prescription deleted (admin only).",
    )
    medicine = models.ForeignKey(
        "pharmacy.Medicine",
        on_delete=models.RESTRICT,
        related_name="prescription_items",
        help_text="Medicine from formulary. No free-text allowed (BR-RX-03).",
    )
    dosage = models.CharField(
        max_length=100,
        help_text="Dose per administration: e.g. 500mg, 1 tablet, 5ml.",
    )
    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        help_text="Administration frequency: OD, BD, TDS, QID, SOS, STAT, Weekly.",
    )
    duration = models.CharField(
        max_length=50,
        help_text="Treatment duration: e.g. 7 days, 30 days, Ongoing.",
    )
    instructions = models.TextField(
        blank=True,
        help_text="Special instructions: take after food, avoid sun exposure, etc.",
    )
    sort_order = models.PositiveSmallIntegerField(
        default=0,
        help_text="Display order within the prescription. Lower numbers displayed first.",
    )

    class Meta:
        db_table = "prescription_item"
        verbose_name = "Prescription Item"
        verbose_name_plural = "Prescription Items"
        ordering = ["sort_order", "created_at"]
        indexes = [
            models.Index(fields=["prescription"], name="idx_rx_item_prescription"),
            models.Index(fields=["medicine"], name="idx_rx_item_medicine"),
        ]

    def __str__(self) -> str:
        return f"RxItem({self.medicine_id}, {self.frequency})"
