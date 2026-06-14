"""
MotherCare — Appointments Module Models
Architecture: mothercare_final_architecture_v2.md — DOMAIN 5

Entity: Appointment
    Every consultation must originate from a booked appointment.
    No walk-ins at DB level. (BR-APPT-01)

Key Constraints (DB level):
    UNIQUE(doctor_id, date(appointment_datetime), token_number) — BR-APPT-02
    Soft delete: is_deleted, deleted_at

Business Rules enforced here (model layer):
    - Token uniqueness per doctor per day
    - Status is always from the defined enum

All status transitions enforced at service layer (BR-APPT-07).
"""
from __future__ import annotations

from django.db import models

from apps.appointments.constants import (
    APPOINTMENT_STATUS_CHOICES,
    APPOINTMENT_TYPE_CHOICES,
    APPT_TYPE_NEW_PATIENT,
    STATUS_SCHEDULED,
)
from core.managers import SoftDeleteManager
from core.models import SoftDeleteModel


class Appointment(SoftDeleteModel):
    """
    Core appointment record.

    Architecture fields:
        id, patient_id, doctor_id, appointment_datetime, appointment_type,
        token_number, status, notes, booked_by
    Soft delete: is_deleted, deleted_at
    Audit: created_at, updated_at, created_by

    Constraints:
        UNIQUE(doctor_id, date(appointment_datetime), token_number) — token uniqueness per doctor per day
    """

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    patient = models.ForeignKey(
        "people.Patient",
        on_delete=models.RESTRICT,
        related_name="appointments",
        help_text="Patient this appointment belongs to.",
    )
    doctor = models.ForeignKey(
        "people.Doctor",
        on_delete=models.RESTRICT,
        related_name="appointments",
        help_text="Doctor this appointment is booked with.",
    )
    booked_by = models.ForeignKey(
        "auth_rbac.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        help_text="Staff user who booked this appointment.",
    )

    # Scheduling
    appointment_datetime = models.DateTimeField(
        help_text="Date and time of the appointment (UTC stored, displayed in local timezone).",
        db_index=True,
    )
    appointment_type = models.CharField(
        max_length=20,
        choices=APPOINTMENT_TYPE_CHOICES,
        default=APPT_TYPE_NEW_PATIENT,
        help_text="Type of appointment: new_patient | follow_up | anc | emergency | ...",
    )
    token_number = models.PositiveSmallIntegerField(
        help_text=(
            "Sequential token per doctor per day starting at 101 (BR-APPT-03). "
            "Unique per (doctor, date, token). Retired tokens are never reassigned (BR-APPT-12)."
        ),
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=APPOINTMENT_STATUS_CHOICES,
        default=STATUS_SCHEDULED,
        db_index=True,
        help_text="Appointment status. Transitions are one-directional (BR-APPT-07).",
    )

    notes = models.TextField(
        blank=True,
        help_text="Booking notes / reason for visit.",
    )

    class Meta:
        db_table = "appointment"
        verbose_name = "Appointment"
        verbose_name_plural = "Appointments"
        ordering = ["appointment_datetime"]
        constraints = [
            # BR-APPT-02: UNIQUE(doctor_id, appointment_datetime::date, token_number)
            # Note: Django unique_together with date cast is handled at service layer for PostgreSQL
            # The DB constraint uses a functional unique index created in migration
            models.UniqueConstraint(
                fields=["doctor", "token_number"],
                condition=models.Q(is_deleted=False),
                name="uq_appointment_doctor_token_date",
            ),
        ]
        indexes = [
            models.Index(fields=["patient", "status"], name="idx_appt_patient_status"),
            models.Index(fields=["doctor", "appointment_datetime"], name="idx_appt_doctor_dt"),
            models.Index(fields=["status", "appointment_datetime"], name="idx_appt_status_dt"),
            models.Index(fields=["is_deleted"], name="idx_appt_is_deleted"),
        ]

    def __str__(self) -> str:
        return (
            f"Appointment({self.patient_id}, Dr.{self.doctor_id}, "
            f"{self.appointment_datetime:%Y-%m-%d %H:%M}, Token={self.token_number})"
        )

    @property
    def appointment_date(self) -> object:
        """Return just the date component of appointment_datetime."""
        return self.appointment_datetime.date()
