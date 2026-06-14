"""
MotherCare — Appointments Admin
"""
from __future__ import annotations

from django.contrib import admin
from django.utils.html import format_html

from apps.appointments.models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = [
        "id_short", "patient_mrn", "patient_name",
        "doctor_name", "appointment_datetime", "token_number",
        "appointment_type", "status_badge", "is_deleted",
    ]
    list_filter = ["status", "appointment_type", "appointment_datetime", "is_deleted"]
    search_fields = [
        "patient__mrn", "patient__full_name",
        "doctor__staff__full_name",
    ]
    readonly_fields = [
        "id", "token_number", "status",
        "created_at", "updated_at", "created_by",
        "is_deleted", "deleted_at",
    ]
    ordering = ["-appointment_datetime"]
    date_hierarchy = "appointment_datetime"

    fieldsets = [
        ("Appointment", {
            "fields": [
                "patient", "doctor", "appointment_datetime",
                "appointment_type", "token_number", "status", "notes",
            ]
        }),
        ("Booking", {
            "fields": ["booked_by"],
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
    def id_short(self, obj: Appointment) -> str:
        return str(obj.id)[:8]

    @admin.display(description="MRN", ordering="patient__mrn")
    def patient_mrn(self, obj: Appointment) -> str:
        return obj.patient.mrn

    @admin.display(description="Patient", ordering="patient__full_name")
    def patient_name(self, obj: Appointment) -> str:
        return obj.patient.full_name

    @admin.display(description="Doctor")
    def doctor_name(self, obj: Appointment) -> str:
        try:
            return obj.doctor.staff.full_name
        except AttributeError:
            return "—"

    @admin.display(description="Status")
    def status_badge(self, obj: Appointment) -> str:
        colour_map = {
            "scheduled": "#526069",
            "confirmed": "#00685d",
            "in_progress": "#f59e0b",
            "completed": "#16a34a",
            "cancelled": "#ba1a1a",
            "no_show": "#7d4e60",
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
        return Appointment.all_objects.select_related(
            "patient", "doctor", "doctor__staff",
        )
