"""
MotherCare — Delivery Module Django Admin Registration
"""
from django.contrib import admin
from apps.delivery.models import Delivery, DeliveryProcedure

class DeliveryProcedureInline(admin.TabularInline):
    model = DeliveryProcedure
    extra = 0
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ["id_short", "patient_mrn", "patient_name", "delivery_datetime", "delivery_mode", "blood_loss_ml", "placenta_complete"]
    list_filter = ["delivery_mode", "placenta_complete", "delivery_datetime"]
    search_fields = ["patient__mrn", "patient__full_name"]
    readonly_fields = ["id", "created_at", "updated_at", "created_by"]
    inlines = [DeliveryProcedureInline]

    def id_short(self, obj) -> str:
        return str(obj.id)[:8]
    id_short.short_description = "ID"

    def patient_mrn(self, obj) -> str:
        return obj.patient.mrn
    patient_mrn.short_description = "Patient MRN"

    def patient_name(self, obj) -> str:
        return obj.patient.full_name
    patient_name.short_description = "Patient Name"

    def get_queryset(self, request):
        return Delivery.all_objects.all()

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(DeliveryProcedure)
class DeliveryProcedureAdmin(admin.ModelAdmin):
    list_display = ["delivery", "procedure_name", "performed_by", "performed_at", "duration_minutes"]
    list_filter = ["performed_at"]
    search_fields = ["delivery__patient__mrn", "procedure_name"]
    readonly_fields = ["id", "created_at", "updated_at", "created_by"]
