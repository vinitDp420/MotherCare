from django.db import models
from core.models import BaseModel


class StitchFile(BaseModel):
    """
    A persistent patient stitch/referral file that acts as a clinical handoff,
    linking a patient's consultations, reports, and prescriptions.
    """
    URGENCY_ROUTINE = "routine"
    URGENCY_URGENT = "urgent"
    URGENCY_EMERGENCY = "emergency"

    URGENCY_CHOICES = [
        (URGENCY_ROUTINE, "Routine"),
        (URGENCY_URGENT, "Urgent"),
        (URGENCY_EMERGENCY, "Emergency"),
    ]

    patient = models.ForeignKey(
        "people.Patient",
        on_delete=models.RESTRICT,
        related_name="stitch_files",
        help_text="Patient this referral/stitch record belongs to."
    )
    specialist_type = models.CharField(
        max_length=100,
        help_text="The type of specialist the patient is referred to (e.g. Cardiologist, Obstetrician)."
    )
    urgency = models.CharField(
        max_length=20,
        choices=URGENCY_CHOICES,
        default=URGENCY_ROUTINE,
        help_text="Urgency level of this referral."
    )
    reason = models.TextField(
        help_text="The core clinical reason/indication for referral."
    )
    referral_note = models.TextField(
        blank=True,
        help_text="Additional referral instructions or notes for the specialist."
    )
    attached_reports = models.ManyToManyField(
        "laboratory.LabReport",
        blank=True,
        related_name="stitch_files",
        help_text="Lab reports attached to this referral."
    )
    attached_prescriptions = models.ManyToManyField(
        "prescriptions.Prescription",
        blank=True,
        related_name="stitch_files",
        help_text="Prescriptions attached to this referral."
    )

    class Meta:
        db_table = "stitch_file"
        verbose_name = "Stitch File"
        verbose_name_plural = "Stitch Files"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"StitchFile({self.id}, patient={self.patient_id}, specialist={self.specialist_type})"
