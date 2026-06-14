"""
MotherCare — Newborn Module Models
"""
from django.db import models
from django.utils import timezone
from core.models import BaseModel, SoftDeleteModel
from apps.newborn.constants import (
    NEWBORN_GENDER_CHOICES,
    NEWBORN_CONDITION_CHOICES,
    FEED_TYPE_CHOICES,
    VACCINE_STATUS_CHOICES,
    VACCINE_STATUS_DUE,
    CONDITION_HEALTHY,
)

class Newborn(SoftDeleteModel):
    """
    Newborn record. Each newborn is registered against a Delivery.
    """
    delivery = models.ForeignKey("delivery.Delivery", on_delete=models.RESTRICT, related_name="newborns")
    baby_mrn = models.CharField(max_length=30, unique=True, help_text="Newborn unique identifier in NB-YYYY-XXX format.")
    gender = models.CharField(max_length=2, choices=NEWBORN_GENDER_CHOICES)
    birth_weight_kg = models.DecimalField(max_digits=5, decimal_places=3, help_text="Birth weight in kg.")
    birth_length_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Birth length in cm.")
    apgar_1min = models.IntegerField()
    apgar_5min = models.IntegerField()
    condition = models.CharField(max_length=20, choices=NEWBORN_CONDITION_CHOICES, default=CONDITION_HEALTHY)
    nicu_required = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "newborn"
        ordering = ["baby_mrn"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(apgar_1min__range=(0, 10)),
                name="chk_newborn_apgar_1min_0_10"
            ),
            models.CheckConstraint(
                check=models.Q(apgar_5min__range=(0, 10)),
                name="chk_newborn_apgar_5min_0_10"
            ),
        ]

    def __str__(self) -> str:
        return f"Newborn {self.baby_mrn} ({self.get_gender_display()})"


class NewbornVaccination(BaseModel):
    """
    Vaccination records for the newborn.
    """
    newborn = models.ForeignKey(Newborn, on_delete=models.CASCADE, related_name="vaccinations")
    vaccine_name = models.CharField(max_length=100)
    dose_number = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=VACCINE_STATUS_CHOICES, default=VACCINE_STATUS_DUE)
    administered_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "newborn_vaccination"
        ordering = ["vaccine_name", "dose_number"]

    def __str__(self) -> str:
        return f"{self.vaccine_name} (Dose {self.dose_number}) - {self.newborn.baby_mrn}"


class NewbornFeedingLog(BaseModel):
    """
    Feeding log for the newborn.
    """
    newborn = models.ForeignKey(Newborn, on_delete=models.CASCADE, related_name="feeding_logs")
    feed_type = models.CharField(max_length=20, choices=FEED_TYPE_CHOICES)
    feed_time = models.DateTimeField(default=timezone.now)
    volume_ml = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Required for formula/ng/iv.")
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "newborn_feeding_log"
        ordering = ["-feed_time"]

    def __str__(self) -> str:
        return f"{self.get_feed_type_display()} at {self.feed_time} for {self.newborn.baby_mrn}"


class NewbornVital(BaseModel):
    """
    Periodic vital recording for newborns.
    """
    newborn = models.ForeignKey(Newborn, on_delete=models.CASCADE, related_name="vitals")
    recorded_at = models.DateTimeField(default=timezone.now)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=3)
    head_circ_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    temperature = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True, help_text="Temperature in Celsius.")
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey("auth_rbac.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+")

    class Meta:
        db_table = "newborn_vital"
        ordering = ["-recorded_at"]

    def __str__(self) -> str:
        return f"Vitals at {self.recorded_at} for {self.newborn.baby_mrn}"
