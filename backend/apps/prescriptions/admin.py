"""
MotherCare — Prescriptions Admin
Immutable models: all fields readonly, no change/delete permissions.
"""
from __future__ import annotations

from django.contrib import admin

from apps.prescriptions.models import Prescription, PrescriptionItem


class PrescriptionItemInline(admin.TabularInline):
    model = PrescriptionItem
    extra = 0
    fields = ["medicine", "dosage", "frequency", "duration", "instructions", "sort_order"]
    readonly_fields = ["medicine", "dosage", "frequency", "duration", "instructions", "sort_order", "created_at"]

    def has_add_permission(self, request: object, obj: object = None) -> bool:
        return False

    def has_change_permission(self, request: object, obj: object = None) -> bool:
        return False

    def has_delete_permission(self, request: object, obj: object = None) -> bool:
        return False


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = [
        "id_short", "patient_mrn", "patient_name",
        "consultation_short", "issued_at", "item_count", "created_at",
    ]
    list_filter = ["issued_at"]
    search_fields = ["patient__mrn", "patient__full_name"]
    readonly_fields = [
        "id", "consultation", "patient", "issued_at",
        "created_at", "updated_at", "created_by",
    ]
    ordering = ["-issued_at"]
    date_hierarchy = "issued_at"
    inlines = [PrescriptionItemInline]

    # BR-RX-01: Prescriptions are immutable
    def has_add_permission(self, request: object) -> bool:
        return False

    def has_change_permission(self, request: object, obj: object = None) -> bool:
        return False

    def has_delete_permission(self, request: object, obj: object = None) -> bool:
        return False

    @admin.display(description="ID")
    def id_short(self, obj: Prescription) -> str:
        return str(obj.id)[:8]

    @admin.display(description="MRN", ordering="patient__mrn")
    def patient_mrn(self, obj: Prescription) -> str:
        return obj.patient.mrn

    @admin.display(description="Patient", ordering="patient__full_name")
    def patient_name(self, obj: Prescription) -> str:
        return obj.patient.full_name

    @admin.display(description="Consultation")
    def consultation_short(self, obj: Prescription) -> str:
        return str(obj.consultation_id)[:8]

    @admin.display(description="Items")
    def item_count(self, obj: Prescription) -> int:
        return obj.items.count()


@admin.register(PrescriptionItem)
class PrescriptionItemAdmin(admin.ModelAdmin):
    list_display = [
        "prescription_short", "medicine_name",
        "dosage", "frequency", "duration",
    ]
    search_fields = ["medicine__name", "prescription__patient__mrn"]
    readonly_fields = [
        "id", "prescription", "medicine",
        "dosage", "frequency", "duration", "instructions", "sort_order",
        "created_at", "updated_at", "created_by",
    ]
    ordering = ["prescription", "sort_order"]

    def has_add_permission(self, request: object) -> bool:
        return False

    def has_change_permission(self, request: object, obj: object = None) -> bool:
        return False

    def has_delete_permission(self, request: object, obj: object = None) -> bool:
        return False

    @admin.display(description="Prescription")
    def prescription_short(self, obj: PrescriptionItem) -> str:
        return str(obj.prescription_id)[:8]

    @admin.display(description="Medicine", ordering="medicine__name")
    def medicine_name(self, obj: PrescriptionItem) -> str:
        return obj.medicine.name
