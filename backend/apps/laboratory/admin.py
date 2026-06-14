"""
MotherCare — Laboratory Admin
Append-only LabReportFile: all readonly, no change/delete.
"""
from __future__ import annotations

from django.contrib import admin
from django.utils.html import format_html

from apps.laboratory.models import LabReportFile, LabTest


class LabReportFileInline(admin.TabularInline):
    model = LabReportFile
    extra = 0
    fields = ["file_url", "file_type", "uploaded_at", "notes", "uploaded_by"]
    readonly_fields = ["file_url", "file_type", "uploaded_at", "notes", "uploaded_by", "created_at"]

    def has_add_permission(self, request: object, obj: object = None) -> bool:
        return False

    def has_change_permission(self, request: object, obj: object = None) -> bool:
        return False

    def has_delete_permission(self, request: object, obj: object = None) -> bool:
        return False


@admin.register(LabTest)
class LabTestAdmin(admin.ModelAdmin):
    list_display = [
        "id_short", "patient_mrn", "patient_name",
        "test_type", "urgency_badge", "status",
        "flagged", "requested_at", "completed_at",
    ]
    list_filter = ["status", "urgency", "flagged", "test_type"]
    search_fields = ["patient__mrn", "patient__full_name", "test_type"]
    readonly_fields = [
        "id", "created_at", "updated_at", "created_by",
        "requested_at", "flagged",
    ]
    ordering = ["urgency", "-requested_at"]
    date_hierarchy = "requested_at"
    inlines = [LabReportFileInline]
    fieldsets = [
        ("Order Details", {
            "fields": [
                "patient", "ordered_by", "consultation",
                "test_type", "urgency", "status",
                "requested_at", "completed_at",
            ]
        }),
        ("Results", {
            "fields": ["key_findings", "flagged"],
        }),
        ("Audit", {
            "fields": ["id", "created_at", "updated_at", "created_by"],
            "classes": ["collapse"],
        }),
    ]

    @admin.display(description="ID")
    def id_short(self, obj: LabTest) -> str:
        return str(obj.id)[:8]

    @admin.display(description="MRN", ordering="patient__mrn")
    def patient_mrn(self, obj: LabTest) -> str:
        return obj.patient.mrn

    @admin.display(description="Patient", ordering="patient__full_name")
    def patient_name(self, obj: LabTest) -> str:
        return obj.patient.full_name

    @admin.display(description="Urgency")
    def urgency_badge(self, obj: LabTest) -> str:
        colour_map = {
            "stat": "#ba1a1a",
            "urgent": "#f59e0b",
            "routine": "#16a34a",
        }
        colour = colour_map.get(obj.urgency, "#000")
        return format_html(
            '<span style="color:{}; font-weight:bold; text-transform:uppercase">{}</span>',
            colour,
            obj.get_urgency_display(),
        )

    def has_delete_permission(self, request: object, obj: object = None) -> bool:
        """Lab records are permanent."""
        return False


@admin.register(LabReportFile)
class LabReportFileAdmin(admin.ModelAdmin):
    list_display = ["id_short", "lab_test_short", "file_type", "uploaded_at", "uploaded_by"]
    search_fields = ["lab_test__patient__mrn", "file_url"]
    readonly_fields = [
        "id", "lab_test", "uploaded_by", "file_url",
        "file_type", "uploaded_at", "notes",
        "created_at", "updated_at", "created_by",
    ]
    ordering = ["-uploaded_at"]

    def has_add_permission(self, request: object) -> bool:
        return False

    def has_change_permission(self, request: object, obj: object = None) -> bool:
        return False

    def has_delete_permission(self, request: object, obj: object = None) -> bool:
        return False

    @admin.display(description="ID")
    def id_short(self, obj: LabReportFile) -> str:
        return str(obj.id)[:8]

    @admin.display(description="Lab Test")
    def lab_test_short(self, obj: LabReportFile) -> str:
        return str(obj.lab_test_id)[:8]
