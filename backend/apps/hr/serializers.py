"""
MotherCare — HR Module Serializers
"""
from rest_framework import serializers
from apps.hr.models import LeaveRequest, ShiftAssignment


class LeaveRequestSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source="staff.full_name", read_only=True)
    staff_designation = serializers.CharField(source="staff.designation", read_only=True)
    staff_department = serializers.CharField(source="staff.department.name", read_only=True)
    leave_type_display = serializers.CharField(source="get_leave_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()
    duration_days = serializers.IntegerField(read_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            "id",
            "staff",
            "staff_name",
            "staff_designation",
            "staff_department",
            "leave_type",
            "leave_type_display",
            "status",
            "status_display",
            "start_date",
            "end_date",
            "duration_days",
            "reason",
            "reviewed_by",
            "reviewed_by_name",
            "reviewed_at",
            "review_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "reviewed_by", "reviewed_at", "created_at", "updated_at"]

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return getattr(obj.reviewed_by, "username", None)
        return None


class LeaveRequestWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = ["staff", "leave_type", "start_date", "end_date", "reason"]

    def validate(self, data):
        if data["end_date"] < data["start_date"]:
            raise serializers.ValidationError({"end_date": "End date must be on or after start date."})
        return data


class LeaveReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["approved", "rejected"])
    review_notes = serializers.CharField(required=False, allow_blank=True, default="")


class ShiftAssignmentSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source="staff.full_name", read_only=True)
    staff_department = serializers.CharField(source="staff.department.name", read_only=True)
    shift_display = serializers.CharField(source="get_shift_display", read_only=True)

    class Meta:
        model = ShiftAssignment
        fields = [
            "id",
            "staff",
            "staff_name",
            "staff_department",
            "shift",
            "shift_display",
            "shift_date",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
