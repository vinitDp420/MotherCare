"""
MotherCare — Consultations Module Models
Architecture: mothercare_final_architecture_v2.md — DOMAIN 6

Entity: Consultation
    One consultation per appointment. Clinical notes workspace for the doctor.
    Soft deletable.

Key Constraints:
    UNIQUE(appointment_id)           — One consultation per appointment (BR-CONS-01)
    CHECK(end_time IS NULL OR end_time > start_time)  — BR-CONS-08
    Soft delete: is_deleted, deleted_at

Business Rules:
    BR-CONS-01: One consultation per appointment
    BR-CONS-02: Parent appointment must be confirmed/in_progress
    BR-CONS-03: patient/doctor inherited from appointment, immutable after creation
    BR-CONS-07: completed consultation is immutable
"""
from __future__ import annotations

from django.db import models
from django.utils import timezone

from apps.consultations.constants import (
    CONS_STATUS_IN_PROGRESS,
    CONSULTATION_STATUS_CHOICES,
)
from core.managers import SoftDeleteManager
from core.models import SoftDeleteModel


class Consultation(SoftDeleteModel):
    """
    Clinical notes workspace for one appointment.

    Architecture fields:
        id, appointment_id (UNIQUE), patient_id, doctor_id,
        start_time, end_time, status, clinical_notes, follow_up_datetime
    Soft delete: is_deleted, deleted_at
    Audit: created_at, updated_at, created_by
    """

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    # The originating appointment (1:1 — enforced by OneToOneField)
    appointment = models.OneToOneField(
        "appointments.Appointment",
        on_delete=models.RESTRICT,
        related_name="consultation",
        help_text=(
            "Source appointment. UNIQUE enforces one-consultation-per-appointment (BR-CONS-01). "
            "RESTRICT prevents deleting appointment with existing consultation."
        ),
    )
    # Denormalised from appointment at creation (BR-CONS-03)
    patient = models.ForeignKey(
        "people.Patient",
        on_delete=models.RESTRICT,
        related_name="consultations",
        help_text="Patient — copied from appointment at creation, immutable after.",
    )
    doctor = models.ForeignKey(
        "people.Doctor",
        on_delete=models.RESTRICT,
        related_name="consultations",
        help_text="Doctor — copied from appointment at creation, immutable after.",
    )

    # Timestamps
    start_time = models.DateTimeField(
        default=timezone.now,
        help_text="When the consultation started (server time).",
    )
    end_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the consultation ended. Set on completion. [DB CHECK: end_time > start_time]",
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=CONSULTATION_STATUS_CHOICES,
        default=CONS_STATUS_IN_PROGRESS,
        db_index=True,
        help_text="Consultation status: in_progress | completed | cancelled",
    )

    # Clinical content
    clinical_notes = models.TextField(
        blank=True,
        help_text="Doctor's clinical notes (SOAP, narrative, or structured). Immutable after completion.",
    )
    diagnosis = models.TextField(
        blank=True,
        help_text="Primary and secondary diagnoses from this consultation.",
    )

    # Follow-up scheduling
    follow_up_datetime = models.DateTimeField(
        null=True,
        blank=True,
        help_text=(
            "Requested follow-up datetime. When set, POST /follow-up creates a new Appointment. "
            "BR-CONS-10: Only one follow-up per consultation."
        ),
    )

    class Meta:
        db_table = "consultation"
        verbose_name = "Consultation"
        verbose_name_plural = "Consultations"
        ordering = ["-start_time"]
        constraints = [
            # BR-CONS-08: end_time must be after start_time
            models.CheckConstraint(
                check=models.Q(end_time__isnull=True) | models.Q(end_time__gt=models.F("start_time")),
                name="chk_consultation_end_after_start",
            ),
        ]
        indexes = [
            models.Index(fields=["patient", "status"], name="idx_cons_patient_status"),
            models.Index(fields=["doctor", "start_time"], name="idx_cons_doctor_start"),
            models.Index(fields=["status", "start_time"], name="idx_cons_status_start"),
            models.Index(fields=["is_deleted"], name="idx_cons_is_deleted"),
        ]

    def __str__(self) -> str:
        return f"Consultation(appt={self.appointment_id}, {self.status}, {self.start_time:%Y-%m-%d})"

    @property
    def is_terminal(self) -> bool:
        return self.status in ("completed", "cancelled")

    @property
    def duration_minutes(self) -> int | None:
        """Return consultation duration in minutes, or None if not completed."""
        if self.end_time and self.start_time:
            return int((self.end_time - self.start_time).total_seconds() / 60)
        return None
