"""
MotherCare — Admissions & Bed Management Django Admin Registration
"""
from django.contrib import admin
from apps.admissions.models import Bed, Admission, WardTransfer

class WardTransferInline(admin.TabularInline):
    model = WardTransfer
    extra = 0
    readonly_fields = ["from_bed", "to_bed", "transferred_at", "reason", "transferred_by", "created_at"]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Bed)
class BedAdmin(admin.ModelAdmin):
    list_display = ["bed_number", "ward_type", "status", "floor", "last_cleaned_at", "created_at"]
    list_filter = ["ward_type", "status", "floor"]
    search_fields = ["bed_number"]
    readonly_fields = ["id", "created_at", "updated_at", "created_by"]

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Admission)
class AdmissionAdmin(admin.ModelAdmin):
    list_display = ["id_short", "patient_mrn", "patient_name", "bed_number", "status", "admission_type", "admitted_at", "actual_discharge"]
    list_filter = ["status", "admission_type", "admitted_at"]
    search_fields = ["patient__mrn", "patient__full_name", "bed__bed_number"]
    readonly_fields = ["id", "created_at", "updated_at", "created_by"]
    inlines = [WardTransferInline]

    def id_short(self, obj) -> str:
        return str(obj.id)[:8]
    id_short.short_description = "ID"

    def patient_mrn(self, obj) -> str:
        return obj.patient.mrn
    patient_mrn.short_description = "Patient MRN"

    def patient_name(self, obj) -> str:
        return obj.patient.full_name
    patient_name.short_description = "Patient Name"

    def bed_number(self, obj) -> str:
        return obj.bed.bed_number
    bed_number.short_description = "Bed"

    def get_queryset(self, request):
        # Allow viewing soft-deleted records in the admin panel
        return Admission.all_objects.all()

    def has_delete_permission(self, request, obj=None):
        # Prevent hard deletion in admin panel
        return False

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(WardTransfer)
class WardTransferAdmin(admin.ModelAdmin):
    list_display = ["admission", "from_bed", "to_bed", "transferred_at", "transferred_by"]
    list_filter = ["transferred_at"]
    search_fields = ["admission__patient__mrn", "from_bed__bed_number", "to_bed__bed_number"]
    readonly_fields = ["id", "created_at", "updated_at", "created_by"]
