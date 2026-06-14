"""
MotherCare — Pregnancy Module Admin
Django admin registrations for Pregnancy domain models.
"""
from __future__ import annotations

from django.contrib import admin

from apps.pregnancy.models import (
    AncVisit,
    Pregnancy,
    PregnancyRiskEvent,
    Vaccination,
    WellnessPlan,
)


# ── Inline for ANC Visits ─────────────────────────────────────────────────────
class AncVisitInline(admin.TabularInline):
    model = AncVisit
    extra = 0
    fields = [
        "visit_date", "week_at_visit", "visit_type", "doctor",
        "bp_systolic", "bp_diastolic", "weight_kg", "fhr_bpm", "glucose_mgdl",
    ]
    readonly_fields = ["created_at"]
    ordering = ["-visit_date"]


# ── Inline for Vaccinations ───────────────────────────────────────────────────
class VaccinationInline(admin.TabularInline):
    model = Vaccination
    extra = 0
    fields = ["vaccine_name", "status", "due_week_start", "due_week_end", "administered_date"]
    readonly_fields = ["created_at"]


# ── Inline for Risk Events ────────────────────────────────────────────────────
class RiskEventInline(admin.TabularInline):
    model = PregnancyRiskEvent
    extra = 0
    fields = ["event_date", "week_number", "risk_level", "event_description"]
    readonly_fields = ["created_at"]
    ordering = ["-event_date"]


# ─────────────────────────────────────────────────────────────────────────────
# Pregnancy Admin
# ─────────────────────────────────────────────────────────────────────────────
@admin.register(Pregnancy)
class PregnancyAdmin(admin.ModelAdmin):
    list_display = [
        "id_short", "patient_mrn", "patient_name",
        "lmp", "edd", "current_week", "trimester",
        "risk_status", "is_active", "is_deleted",
    ]
    list_filter = ["risk_status", "trimester", "is_active", "is_deleted"]
    search_fields = [
        "patient__mrn", "patient__full_name",
        "assigned_doctor__staff__full_name",
    ]
    readonly_fields = [
        "id", "current_week", "trimester",
        "created_at", "updated_at", "created_by",
        "is_deleted", "deleted_at",
    ]
    ordering = ["-created_at"]
    inlines = [AncVisitInline, VaccinationInline, RiskEventInline]

    fieldsets = [
        ("Clinical", {
            "fields": [
                "patient", "assigned_doctor",
                "lmp", "edd", "current_week", "trimester",
                "risk_status", "gravida", "para",
                "chronic_conditions", "is_active",
            ]
        }),
        ("Soft Delete", {
            "fields": ["is_deleted", "deleted_at"],
            "classes": ["collapse"],
        }),
        ("Audit", {
            "fields": ["id", "created_at", "updated_at", "created_by"],
            "classes": ["collapse"],
        }),
    ]

    @admin.display(description="ID (Short)")
    def id_short(self, obj: Pregnancy) -> str:
        return str(obj.id)[:8]

    @admin.display(description="MRN", ordering="patient__mrn")
    def patient_mrn(self, obj: Pregnancy) -> str:
        return obj.patient.mrn

    @admin.display(description="Patient", ordering="patient__full_name")
    def patient_name(self, obj: Pregnancy) -> str:
        return obj.patient.full_name

    def has_delete_permission(self, request: object, obj: object = None) -> bool:
        """Hard DELETE is forbidden on Pregnancy (BR-SD-01)."""
        return False

    def get_queryset(self, request: object) -> object:
        """Show ALL pregnancies including soft-deleted in admin."""
        return Pregnancy.all_objects.all()


# ─────────────────────────────────────────────────────────────────────────────
# ANC Visit Admin
# ─────────────────────────────────────────────────────────────────────────────
@admin.register(AncVisit)
class AncVisitAdmin(admin.ModelAdmin):
    list_display = [
        "pregnancy_short", "visit_date", "week_at_visit",
        "visit_type", "doctor_name",
        "bp_systolic", "bp_diastolic", "weight_kg",
    ]
    list_filter = ["visit_type", "visit_date"]
    search_fields = [
        "pregnancy__patient__mrn",
        "pregnancy__patient__full_name",
        "doctor__staff__full_name",
    ]
    readonly_fields = ["id", "created_at", "updated_at", "created_by"]
    ordering = ["-visit_date"]

    @admin.display(description="Pregnancy")
    def pregnancy_short(self, obj: AncVisit) -> str:
        return f"{obj.pregnancy.patient.mrn} ({obj.pregnancy.lmp})"

    @admin.display(description="Doctor")
    def doctor_name(self, obj: AncVisit) -> str:
        try:
            return obj.doctor.staff.full_name
        except AttributeError:
            return "—"


# ─────────────────────────────────────────────────────────────────────────────
# Risk Event Admin
# ─────────────────────────────────────────────────────────────────────────────
@admin.register(PregnancyRiskEvent)
class PregnancyRiskEventAdmin(admin.ModelAdmin):
    list_display = [
        "pregnancy_short", "event_date", "week_number",
        "risk_level", "event_description_short",
    ]
    list_filter = ["risk_level", "event_date"]
    search_fields = ["pregnancy__patient__mrn", "event_description"]
    readonly_fields = ["id", "created_at", "updated_at", "created_by"]
    ordering = ["-event_date"]

    @admin.display(description="Pregnancy")
    def pregnancy_short(self, obj: PregnancyRiskEvent) -> str:
        return obj.pregnancy.patient.mrn

    @admin.display(description="Description")
    def event_description_short(self, obj: PregnancyRiskEvent) -> str:
        return obj.event_description[:60]


# ─────────────────────────────────────────────────────────────────────────────
# Vaccination Admin
# ─────────────────────────────────────────────────────────────────────────────
@admin.register(Vaccination)
class VaccinationAdmin(admin.ModelAdmin):
    list_display = [
        "pregnancy_short", "vaccine_name", "status",
        "due_week_start", "due_week_end", "administered_date",
    ]
    list_filter = ["status"]
    search_fields = [
        "pregnancy__patient__mrn",
        "vaccine_name",
        "administered_by__staff__full_name",
    ]
    readonly_fields = ["id", "created_at", "updated_at", "created_by"]
    ordering = ["pregnancy", "due_week_start"]

    @admin.display(description="Pregnancy")
    def pregnancy_short(self, obj: Vaccination) -> str:
        return obj.pregnancy.patient.mrn


# ─────────────────────────────────────────────────────────────────────────────
# Wellness Plan Admin
# ─────────────────────────────────────────────────────────────────────────────
@admin.register(WellnessPlan)
class WellnessPlanAdmin(admin.ModelAdmin):
    list_display = ["pregnancy_short", "dietary_protocol_short", "created_at"]
    search_fields = ["pregnancy__patient__mrn"]
    readonly_fields = ["id", "created_at", "updated_at", "created_by"]

    @admin.display(description="Pregnancy")
    def pregnancy_short(self, obj: WellnessPlan) -> str:
        return obj.pregnancy.patient.mrn

    @admin.display(description="Dietary Protocol")
    def dietary_protocol_short(self, obj: WellnessPlan) -> str:
        return (obj.dietary_protocol or "—")[:60]
