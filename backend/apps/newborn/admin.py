"""
MotherCare — Newborn Module Django Admin Registration
"""
from django.contrib import admin
from apps.newborn.models import Newborn, NewbornVaccination, NewbornFeedingLog, NewbornVital

class NewbornVaccinationInline(admin.TabularInline):
    model = NewbornVaccination
    extra = 0


class NewbornFeedingLogInline(admin.TabularInline):
    model = NewbornFeedingLog
    extra = 0


class NewbornVitalInline(admin.TabularInline):
    model = NewbornVital
    extra = 0


@admin.register(Newborn)
class NewbornAdmin(admin.ModelAdmin):
    list_display = ["baby_mrn", "gender", "birth_weight_kg", "apgar_1min", "apgar_5min", "condition", "nicu_required"]
    list_filter = ["gender", "condition", "nicu_required"]
    search_fields = ["baby_mrn", "delivery__patient__mrn"]
    readonly_fields = ["id", "baby_mrn", "created_at", "updated_at", "created_by"]
    inlines = [NewbornVaccinationInline, NewbornFeedingLogInline, NewbornVitalInline]

    def get_queryset(self, request):
        return Newborn.all_objects.all()

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(NewbornVaccination)
class NewbornVaccinationAdmin(admin.ModelAdmin):
    list_display = ["newborn", "vaccine_name", "dose_number", "status", "administered_date"]
    list_filter = ["status", "administered_date"]
    search_fields = ["newborn__baby_mrn", "vaccine_name"]
    readonly_fields = ["id", "created_at", "updated_at", "created_by"]


@admin.register(NewbornFeedingLog)
class NewbornFeedingLogAdmin(admin.ModelAdmin):
    list_display = ["newborn", "feed_type", "feed_time", "volume_ml"]
    list_filter = ["feed_type", "feed_time"]
    search_fields = ["newborn__baby_mrn"]
    readonly_fields = ["id", "created_at", "created_by"]


@admin.register(NewbornVital)
class NewbornVitalAdmin(admin.ModelAdmin):
    list_display = ["newborn", "recorded_at", "weight_kg", "temperature", "recorded_by"]
    list_filter = ["recorded_at"]
    search_fields = ["newborn__baby_mrn"]
    readonly_fields = ["id", "created_at", "created_by"]
