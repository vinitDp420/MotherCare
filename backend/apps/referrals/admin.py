from django.contrib import admin
from apps.referrals.models import StitchFile


@admin.register(StitchFile)
class StitchFileAdmin(admin.ModelAdmin):
    list_display = ["id", "patient", "specialist_type", "urgency", "created_by", "created_at"]
    list_filter = ["urgency", "specialist_type", "created_at"]
    search_fields = ["patient__full_name", "patient__mrn", "reason", "specialist_type"]
    raw_id_fields = ["patient", "created_by"]
    filter_horizontal = ["attached_reports", "attached_prescriptions"]
