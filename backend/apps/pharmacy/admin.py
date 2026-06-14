"""
MotherCare — Pharmacy Admin
Sprint 5 stub — full pharmacy admin in Sprint 6.
"""
from django.contrib import admin

from apps.pharmacy.models import Medicine, MedicineBatch, PharmacySale, PharmacySaleItem


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ["name", "generic_name", "category", "unit", "is_active", "reorder_level"]
    list_filter = ["category", "is_active"]
    search_fields = ["name", "generic_name"]
    ordering = ["name"]


@admin.register(MedicineBatch)
class MedicineBatchAdmin(admin.ModelAdmin):
    list_display = ["medicine", "batch_number", "quantity", "expiry_date", "supplier_name"]
    list_filter = ["expiry_date"]
    search_fields = ["medicine__name", "batch_number"]
    ordering = ["expiry_date"]


@admin.register(PharmacySale)
class PharmacySaleAdmin(admin.ModelAdmin):
    list_display = ["invoice_number", "patient", "total_amount", "sold_at"]
    list_filter = ["sold_at"]
    search_fields = ["invoice_number", "patient__mrn"]
    ordering = ["-sold_at"]


@admin.register(PharmacySaleItem)
class PharmacySaleItemAdmin(admin.ModelAdmin):
    list_display = ["sale", "medicine_batch", "qty", "unit_price", "line_total"]
    readonly_fields = ["line_total"]
