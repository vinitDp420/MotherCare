"""
MotherCare — Consultations Admin
"""
from __future__ import annotations

from django.contrib import admin
from django.utils.html import format_html

from apps.consultations.models import Consultation


@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = [
        "id_short", "patient_mrn", "patient_name",
        "doctor_name", "start_time", "end_time",
        "status_badge", "duration_minutes", "is_deleted",
    ]
    list_filter = ["status", "start_time", "is_deleted"]
    search_fields = [
        "patient__mrn", "patient__full_name",
        "doctor__staff__full_name",
        "clinical_notes", "diagnosis",
    ]
    readonly_fields = [
        "id", "patient", "doctor",         # Immutable after creation (BR-CONS-03)
        "appointment", "start_time",
        "created_at", "updated_at", "created_by",
        "is_deleted", "deleted_at",
        "duration_minutes",
    ]
    ordering = ["-start_time"]

    fieldsets = [
        ("Clinical", {
            "fields": [
                "appointment", "patient", "doctor",
                "start_time", "end_time", "status",
                "clinical_notes", "diagnosis",
                "follow_up_datetime",
            ]
        }),
        ("Computed", {
            "fields": ["duration_minutes"],
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

    @admin.display(description="ID")
    def id_short(self, obj: Consultation) -> str:
        return str(obj.id)[:8]

    @admin.display(description="MRN")
    def patient_mrn(self, obj: Consultation) -> str:
        return obj.patient.mrn

    @admin.display(description="Patient")
    def patient_name(self, obj: Consultation) -> str:
        return obj.patient.full_name

    @admin.display(description="Doctor")
    def doctor_name(self, obj: Consultation) -> str:
        try:
            return obj.doctor.staff.full_name
        except AttributeError:
            return "—"

    @admin.display(description="Status")
    def status_badge(self, obj: Consultation) -> str:
        colour_map = {
            "in_progress": "#f59e0b",
            "completed": "#16a34a",
            "cancelled": "#ba1a1a",
        }
        colour = colour_map.get(obj.status, "#000")
        return format_html(
            '<span style="color:{}; font-weight:bold">{}</span>',
            colour,
            obj.get_status_display(),
        )

    def has_delete_permission(self, request: object, obj: object = None) -> bool:
        """Hard DELETE is forbidden (BR-SD-01)."""
        return False

    def get_queryset(self, request: object) -> object:
        return Consultation.all_objects.select_related(
            "patient", "doctor", "doctor__staff", "appointment",
        )
