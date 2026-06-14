"""
MotherCare — People Module Admin
Django admin registration for all people entities.
"""
from django.contrib import admin

from apps.people.models import (
    Doctor,
    EmergencyContact,
    Patient,
    PatientAllergy,
    PatientEmergencyContact,
    Staff,
)


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    """Patient admin with soft-delete awareness."""

    list_display = ["mrn", "full_name", "dob", "blood_group", "phone", "is_active", "is_deleted", "created_at"]
    list_filter = ["is_active", "is_deleted", "blood_group"]
    search_fields = ["mrn", "full_name", "phone", "email"]
    readonly_fields = ["mrn", "created_at", "updated_at", "deleted_at", "created_by"]
    ordering = ["-created_at"]

    def get_queryset(self, request: object) -> object:
        """Show ALL patients including soft-deleted in admin."""
        return Patient.all_objects.all()

    def has_delete_permission(self, request: object, obj: object = None) -> bool:
        """Hard DELETE is forbidden on patients (BR-PAT-10)."""
        return False


@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
    list_display = ["name", "phone", "alt_phone", "email", "created_at"]
    search_fields = ["name", "phone", "email"]
    readonly_fields = ["created_at", "updated_at", "created_by"]


@admin.register(PatientEmergencyContact)
class PatientEmergencyContactAdmin(admin.ModelAdmin):
    list_display = ["patient", "contact", "relationship_type", "priority", "is_primary"]
    list_filter = ["relationship_type", "is_primary"]
    search_fields = ["patient__mrn", "patient__full_name", "contact__name"]
    readonly_fields = ["is_primary", "created_at", "updated_at", "created_by"]


@admin.register(PatientAllergy)
class PatientAllergyAdmin(admin.ModelAdmin):
    list_display = ["patient", "allergen", "severity", "reaction_type", "recorded_date"]
    list_filter = ["severity"]
    search_fields = ["patient__mrn", "patient__full_name", "allergen"]
    readonly_fields = ["created_at", "updated_at", "created_by"]


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ["full_name", "designation", "department", "phone", "is_active", "join_date"]
    list_filter = ["is_active", "department"]
    search_fields = ["full_name", "designation", "phone", "email"]
    readonly_fields = ["created_at", "updated_at", "created_by"]


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = [
        "get_full_name", "specialisation", "registration_no",
        "available_from", "available_to", "get_is_active",
    ]
    list_filter = ["specialisation", "staff__is_active"]
    search_fields = ["staff__full_name", "specialisation", "registration_no"]
    readonly_fields = ["created_at", "updated_at", "created_by"]

    @admin.display(description="Full Name", ordering="staff__full_name")
    def get_full_name(self, obj: Doctor) -> str:
        return f"Dr. {obj.staff.full_name}"

    @admin.display(description="Active", boolean=True, ordering="staff__is_active")
    def get_is_active(self, obj: Doctor) -> bool:
        return obj.staff.is_active
