"""
MotherCare — Delivery Module Models
"""
from django.db import models
from django.utils import timezone
from core.models import BaseModel, SoftDeleteModel
from apps.delivery.constants import DELIVERY_MODE_CHOICES

class Delivery(SoftDeleteModel):
    """
    Delivery record. One delivery per admission, linked via unique FK.
    """
    admission = models.OneToOneField("admissions.Admission", on_delete=models.RESTRICT, related_name="delivery")
    patient = models.ForeignKey("people.Patient", on_delete=models.RESTRICT, related_name="deliveries")
    doctor = models.ForeignKey("people.Doctor", on_delete=models.RESTRICT, related_name="deliveries")
    delivery_datetime = models.DateTimeField()
    delivery_mode = models.CharField(max_length=20, choices=DELIVERY_MODE_CHOICES)
    blood_loss_ml = models.IntegerField(null=True, blank=True, help_text="Total estimated blood loss in ml.")
    placenta_complete = models.BooleanField(default=True)
    complications = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "delivery"
        ordering = ["-delivery_datetime"]

    def __str__(self) -> str:
        return f"Delivery {self.id} for Patient {self.patient_id}"


class DeliveryProcedure(BaseModel):
    """
    Structured procedure log per delivery.
    """
    delivery = models.ForeignKey(Delivery, on_delete=models.RESTRICT, related_name="procedures")
    performed_by = models.ForeignKey("people.Doctor", on_delete=models.RESTRICT, related_name="+")
    procedure_name = models.CharField(max_length=120, help_text="Name of the procedure, e.g. Caesarean Section.")
    indication = models.TextField(blank=True)
    technique = models.TextField(blank=True)
    implants_used = models.TextField(blank=True)
    duration_minutes = models.IntegerField(default=0, help_text="Duration in minutes.")
    post_op_instructions = models.TextField(blank=True)
    performed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "delivery_procedure"
        ordering = ["-performed_at"]

    def __str__(self) -> str:
        return f"{self.procedure_name} ({self.delivery_id})"
