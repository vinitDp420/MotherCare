"""
MotherCare — Billing Module Django Admin Registration
"""
from django.contrib import admin
from apps.billing.models import Bill, BillItem, BillPayment

class BillItemInline(admin.TabularInline):
    model = BillItem
    extra = 0
    readonly_fields = ["total_price"]


class BillPaymentInline(admin.TabularInline):
    model = BillPayment
    extra = 0


@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ["invoice_number", "patient_mrn", "patient_name", "bill_type", "total_amount", "amount_paid", "payment_status", "generated_at"]
    list_filter = ["bill_type", "payment_status", "generated_at"]
    search_fields = ["invoice_number", "patient__mrn", "patient__full_name"]
    readonly_fields = ["id", "invoice_number", "total_amount", "amount_paid", "payment_status", "created_at", "updated_at", "created_by"]
    inlines = [BillItemInline, BillPaymentInline]

    def patient_mrn(self, obj) -> str:
        return obj.patient.mrn
    patient_mrn.short_description = "Patient MRN"

    def patient_name(self, obj) -> str:
        return obj.patient.full_name
    patient_name.short_description = "Patient Name"

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(BillItem)
class BillItemAdmin(admin.ModelAdmin):
    list_display = ["bill", "item_type", "item_name", "quantity", "unit_price", "total_price"]
    list_filter = ["item_type"]
    search_fields = ["bill__invoice_number", "item_name"]
    readonly_fields = ["id", "total_price", "created_at", "updated_at", "created_by"]


@admin.register(BillPayment)
class BillPaymentAdmin(admin.ModelAdmin):
    list_display = ["bill", "amount", "payment_method", "transaction_ref", "paid_at", "recorded_by"]
    list_filter = ["payment_method", "paid_at"]
    search_fields = ["bill__invoice_number", "transaction_ref"]
    readonly_fields = ["id", "created_at", "created_by"]
