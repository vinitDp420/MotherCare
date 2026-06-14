"""
MotherCare — Pregnancy Module Models
Architecture: mothercare_final_architecture_v2.md — DOMAIN 4

Entities:
    Pregnancy           — One record per pregnancy per patient (soft-deletable)
    AncVisit            — One row per antenatal care visit (vitals stored typed)
    PregnancyRiskEvent  — Longitudinal risk milestone log (feeds risk timeline UI)
    Vaccination         — Maternal vaccine tracker (NOT newborn vaccinations)
    WellnessPlan        — Dietary + daily precaution guidelines (1:1 with Pregnancy)

Business Rules Implemented:
    BR-PAT-04  — A patient may have zero or one ACTIVE pregnancy at any time
    BR-SD-01   — Pregnancy is a soft-delete entity
    DB CHECK   — edd > lmp
    DB CHECK   — current_week BETWEEN 1 AND 45
    DB CHECK   — trimester IN (1, 2, 3)
"""
from __future__ import annotations

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.pregnancy.constants import (
    GESTATIONAL_WEEK_MAX,
    GESTATIONAL_WEEK_MIN,
    RISK_EVENT_LEVEL_CHOICES,
    RISK_STATUS_CHOICES,
    RISK_STATUS_NORMAL,
    TRIMESTER_CHOICES,
    VACC_STATUS_DUE,
    VACCINATION_STATUS_CHOICES,
    VISIT_TYPE_CHOICES,
    VISIT_TYPE_ROUTINE,
)
from core.managers import SoftDeleteManager
from core.models import BaseModel, SoftDeleteModel


# ─────────────────────────────────────────────────────────────────────────────
# Pregnancy
# ─────────────────────────────────────────────────────────────────────────────
class Pregnancy(SoftDeleteModel):
    """
    One record per pregnancy per patient.
    Multiple historical pregnancies supported on same patient.

    Architecture fields: id, patient_id, assigned_doctor_id, lmp, edd,
        current_week, trimester, risk_status, gravida, para,
        chronic_conditions, is_active
    Soft delete: is_deleted, deleted_at
    Audit: created_at, updated_at, created_by

    BR-PAT-04: At most ONE active pregnancy per patient at any time.
               Enforced at service layer (not DB constraint, to allow historical records).
    """

    # Override managers from SoftDeleteModel base
    objects = SoftDeleteManager()
    all_objects = models.Manager()

    patient = models.ForeignKey(
        "people.Patient",
        on_delete=models.RESTRICT,
        related_name="pregnancies",
        help_text="Patient this pregnancy belongs to. RESTRICT — cannot delete patient with pregnancies.",
    )
    assigned_doctor = models.ForeignKey(
        "people.Doctor",
        on_delete=models.RESTRICT,
        related_name="assigned_pregnancies",
        null=True,
        blank=True,
        help_text="Doctor assigned to manage this pregnancy. RESTRICT protects data integrity.",
    )

    # Gestational dates (core clinical fields)
    lmp = models.DateField(
        help_text="Last Menstrual Period date. Used to calculate EDD and current_week.",
    )
    edd = models.DateField(
        help_text="Estimated Due Date. Must be after LMP. [DB CHECK: edd > lmp]",
    )

    # Current state (auto-calculated by service layer)
    current_week = models.PositiveSmallIntegerField(
        default=1,
        validators=[
            MinValueValidator(GESTATIONAL_WEEK_MIN),
            MaxValueValidator(GESTATIONAL_WEEK_MAX),
        ],
        help_text="Current gestational week (1–45). Auto-calculated from LMP. [DB CHECK: 1–45]",
    )
    trimester = models.PositiveSmallIntegerField(
        default=1,
        choices=TRIMESTER_CHOICES,
        help_text="Current trimester (1, 2, or 3). Auto-derived from current_week.",
    )
    risk_status = models.CharField(
        max_length=20,
        choices=RISK_STATUS_CHOICES,
        default=RISK_STATUS_NORMAL,
        db_index=True,
        help_text="Clinical risk classification. normal | high_risk | critical",
    )

    # Obstetric history (gravida/para)
    gravida = models.PositiveSmallIntegerField(
        default=1,
        help_text="Total number of pregnancies including this one (G in GPAL notation).",
    )
    para = models.PositiveSmallIntegerField(
        default=0,
        help_text="Number of previous deliveries after 20 weeks (P in GPAL notation).",
    )

    # Clinical notes
    chronic_conditions = models.TextField(
        blank=True,
        help_text="Pre-existing chronic conditions relevant to this pregnancy (free text).",
    )

    # Active flag — differentiates current from historical
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="TRUE = current active pregnancy. FALSE = concluded / historical.",
    )

    class Meta:
        db_table = "pregnancy"
        verbose_name = "Pregnancy"
        verbose_name_plural = "Pregnancies"
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(edd__gt=models.F("lmp")),
                name="chk_pregnancy_edd_after_lmp",
            ),
            models.CheckConstraint(
                check=models.Q(current_week__gte=GESTATIONAL_WEEK_MIN)
                & models.Q(current_week__lte=GESTATIONAL_WEEK_MAX),
                name="chk_pregnancy_week_range",
            ),
            models.CheckConstraint(
                check=models.Q(trimester__in=[1, 2, 3]),
                name="chk_pregnancy_trimester_valid",
            ),
        ]
        indexes = [
            models.Index(fields=["patient", "is_active"], name="idx_pregnancy_patient_active"),
            models.Index(fields=["risk_status", "is_active"], name="idx_pregnancy_risk_active"),
            models.Index(fields=["is_deleted"], name="idx_pregnancy_is_deleted"),
            models.Index(fields=["assigned_doctor"], name="idx_pregnancy_doctor"),
        ]

    def __str__(self) -> str:
        status = "Active" if self.is_active else "Concluded"
        return f"Pregnancy({self.patient}, LMP={self.lmp}, {status})"

    @property
    def is_high_risk(self) -> bool:
        """Convenience check for high-risk or critical status."""
        return self.risk_status in ("high_risk", "critical")


# ─────────────────────────────────────────────────────────────────────────────
# ANC Visit
# ─────────────────────────────────────────────────────────────────────────────
class AncVisit(BaseModel):
    """
    One row per antenatal care visit.
    Vitals stored as typed numeric columns for range queries and trend charts.

    Architecture fields: id, pregnancy_id, doctor_id, visit_date, week_at_visit,
        visit_type, bp_systolic, bp_diastolic, weight_kg, fhr_bpm,
        glucose_mgdl, notes
    """

    pregnancy = models.ForeignKey(
        Pregnancy,
        on_delete=models.RESTRICT,
        related_name="anc_visits",
        help_text="Parent pregnancy. RESTRICT — do not delete pregnancy with ANC visits.",
    )
    doctor = models.ForeignKey(
        "people.Doctor",
        on_delete=models.RESTRICT,
        related_name="anc_visits_conducted",
        help_text="Doctor who conducted this visit. RESTRICT protects data integrity.",
    )

    visit_date = models.DateField(
        help_text="Date of the ANC visit.",
    )
    week_at_visit = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(GESTATIONAL_WEEK_MIN),
            MaxValueValidator(GESTATIONAL_WEEK_MAX),
        ],
        help_text="Gestational week at the time of this visit (1–45).",
    )
    visit_type = models.CharField(
        max_length=20,
        choices=VISIT_TYPE_CHOICES,
        default=VISIT_TYPE_ROUTINE,
        help_text="Type of ANC visit.",
    )

    # Vitals (all optional — not every visit measures every metric)
    bp_systolic = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(60), MaxValueValidator(200)],
        help_text="Systolic blood pressure (mmHg). Normal range: 90–140.",
    )
    bp_diastolic = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(40), MaxValueValidator(140)],
        help_text="Diastolic blood pressure (mmHg). Normal range: 60–90.",
    )
    weight_kg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(30), MaxValueValidator(200)],
        help_text="Maternal weight in kilograms.",
    )
    fhr_bpm = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(60), MaxValueValidator(200)],
        help_text="Foetal Heart Rate in beats per minute. Normal: 120–160.",
    )
    glucose_mgdl = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(40), MaxValueValidator(600)],
        help_text="Fasting or random blood glucose (mg/dL). GDM screening.",
    )

    notes = models.TextField(
        blank=True,
        help_text="Clinical notes from this ANC visit.",
    )

    class Meta:
        db_table = "anc_visit"
        verbose_name = "ANC Visit"
        verbose_name_plural = "ANC Visits"
        ordering = ["-visit_date"]
        indexes = [
            models.Index(fields=["pregnancy", "visit_date"], name="idx_ancvisit_preg_date"),
            models.Index(fields=["doctor", "visit_date"], name="idx_ancvisit_doc_date"),
        ]

    def __str__(self) -> str:
        return f"ANCVisit(Week {self.week_at_visit}, {self.visit_date}, {self.visit_type})"


# ─────────────────────────────────────────────────────────────────────────────
# Pregnancy Risk Event
# ─────────────────────────────────────────────────────────────────────────────
class PregnancyRiskEvent(BaseModel):
    """
    Longitudinal risk milestone log.
    Example: "Week 24 — GDM Detected", "Week 30 — Pre-eclampsia Suspected"
    Feeds the risk timeline UI on the pregnancy tracking screen.

    Architecture fields: id, pregnancy_id, week_number, risk_level,
        event_description, recorded_by, event_date
    """

    pregnancy = models.ForeignKey(
        Pregnancy,
        on_delete=models.CASCADE,
        related_name="risk_events",
        help_text="Parent pregnancy. CASCADE — risk events deleted with pregnancy.",
    )
    recorded_by = models.ForeignKey(
        "auth_rbac.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        help_text="User who recorded this risk event. SET NULL if user is deleted.",
    )

    event_date = models.DateField(
        help_text="Date this risk event was recorded / observed.",
    )
    week_number = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(GESTATIONAL_WEEK_MIN),
            MaxValueValidator(GESTATIONAL_WEEK_MAX),
        ],
        help_text="Gestational week at which this event occurred.",
    )
    risk_level = models.CharField(
        max_length=20,
        choices=RISK_EVENT_LEVEL_CHOICES,
        db_index=True,
        help_text="Severity of this risk event: low | moderate | high | critical",
    )
    event_description = models.TextField(
        help_text="Clinical description of the risk event (e.g. 'GDM detected on oral glucose test').",
    )

    class Meta:
        db_table = "pregnancy_risk_event"
        verbose_name = "Pregnancy Risk Event"
        verbose_name_plural = "Pregnancy Risk Events"
        ordering = ["-event_date", "-week_number"]
        indexes = [
            models.Index(fields=["pregnancy", "event_date"], name="idx_risk_event_preg_date"),
            models.Index(fields=["risk_level"], name="idx_risk_event_level"),
        ]

    def __str__(self) -> str:
        return f"RiskEvent(Week {self.week_number}, {self.risk_level}: {self.event_description[:40]})"


# ─────────────────────────────────────────────────────────────────────────────
# Vaccination (Maternal)
# ─────────────────────────────────────────────────────────────────────────────
class Vaccination(BaseModel):
    """
    Tracks vaccines for the MOTHER during pregnancy.
    NOT to be confused with NewbornVaccination (Domain 9).

    Architecture fields: id, pregnancy_id, vaccine_name, status,
        due_week_start, due_week_end, administered_date,
        administered_by → doctor (SET NULL), notes
    Enum — status: due, administered, not_required, skipped
    """

    pregnancy = models.ForeignKey(
        Pregnancy,
        on_delete=models.CASCADE,
        related_name="vaccinations",
        help_text="Parent pregnancy. CASCADE — vaccinations deleted with pregnancy.",
    )
    administered_by = models.ForeignKey(
        "people.Doctor",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="maternal_vaccinations_administered",
        help_text="Doctor who administered this vaccine. SET NULL if doctor record deleted.",
    )

    vaccine_name = models.CharField(
        max_length=200,
        help_text="Name of the vaccine (e.g. 'TT Dose 1', 'Influenza', 'Hepatitis B').",
    )
    status = models.CharField(
        max_length=20,
        choices=VACCINATION_STATUS_CHOICES,
        default=VACC_STATUS_DUE,
        db_index=True,
        help_text="Vaccination status: due | administered | not_required | skipped",
    )
    due_week_start = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(GESTATIONAL_WEEK_MAX)],
        help_text="Earliest gestational week this vaccine is due.",
    )
    due_week_end = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(GESTATIONAL_WEEK_MAX)],
        help_text="Latest gestational week this vaccine is due.",
    )
    administered_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date vaccine was administered. Required when status = 'administered'.",
    )
    notes = models.TextField(
        blank=True,
        help_text="Reason for skip, batch number, or any other notes.",
    )

    class Meta:
        db_table = "vaccination"
        verbose_name = "Vaccination (Maternal)"
        verbose_name_plural = "Vaccinations (Maternal)"
        ordering = ["due_week_start", "vaccine_name"]
        indexes = [
            models.Index(fields=["pregnancy", "status"], name="idx_vaccination_preg_status"),
        ]

    def __str__(self) -> str:
        return f"Vaccination({self.vaccine_name}, {self.status})"


# ─────────────────────────────────────────────────────────────────────────────
# Wellness Plan
# ─────────────────────────────────────────────────────────────────────────────
class WellnessPlan(BaseModel):
    """
    Dietary and daily precaution guidelines for a pregnancy.
    One plan per pregnancy (1:1 enforced by UNIQUE constraint).

    Architecture fields: id, pregnancy_id (UNIQUE), dietary_protocol,
        dietary_items (JSONB array), daily_precautions (JSONB array)
    """

    pregnancy = models.OneToOneField(
        Pregnancy,
        on_delete=models.CASCADE,
        related_name="wellness_plan",
        help_text="Parent pregnancy. CASCADE — wellness plan deleted with pregnancy. UNIQUE enforces 1:1.",
    )

    dietary_protocol = models.TextField(
        blank=True,
        help_text="High-level dietary protocol description (e.g. 'Low-GI diet recommended for GDM risk').",
    )
    dietary_items = models.JSONField(
        default=list,
        blank=True,
        help_text="JSONB array of specific dietary items/recommendations.",
    )
    daily_precautions = models.JSONField(
        default=list,
        blank=True,
        help_text="JSONB array of daily precautions and activity guidelines.",
    )

    class Meta:
        db_table = "wellness_plan"
        verbose_name = "Wellness Plan"
        verbose_name_plural = "Wellness Plans"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"WellnessPlan(Pregnancy={self.pregnancy_id})"
