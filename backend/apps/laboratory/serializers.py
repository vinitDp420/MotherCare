"""
MotherCare — Laboratory Module Serializers
"""
from __future__ import annotations

from rest_framework import serializers

from apps.laboratory.constants import (
    FILE_TYPE_CHOICES,
    LAB_STATUS_CHOICES,
    TEST_TYPE_CHOICES,
    URGENCY_CHOICES,
    URGENCY_ROUTINE,
)
from apps.laboratory.models import LabReportFile, LabTest

# ─────────────────────────────────────────────────────────────────────────────
# LabReportFile
# ─────────────────────────────────────────────────────────────────────────────

class LabReportFileSerializer(serializers.ModelSerializer):
    """Read serializer — nested inside LabTestDetailSerializer."""
    file_type_display = serializers.CharField(source="get_file_type_display", read_only=True)

    class Meta:
        model = LabReportFile
        fields = [
            "id", "lab_test", "file_url", "file_type", "file_type_display",
            "uploaded_at", "uploaded_by", "notes",
        ]
        read_only_fields = fields


class LabReportFileUploadSerializer(serializers.Serializer):
    """Input for POST /api/v1/laboratory/lab-tests/{id}/upload-report/"""
    file = serializers.FileField(
        help_text="The report file to upload (PDF, JPEG, PNG, DICOM).",
    )
    notes = serializers.CharField(required=False, allow_blank=True, default="")


# ─────────────────────────────────────────────────────────────────────────────
# LabTest List
# ─────────────────────────────────────────────────────────────────────────────

class LabTestListSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    doctor_name = serializers.SerializerMethodField()
    test_type_display = serializers.CharField(source="get_test_type_display", read_only=True)
    urgency_display = serializers.CharField(source="get_urgency_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_terminal = serializers.BooleanField(read_only=True)
    is_critical = serializers.BooleanField(read_only=True)

    class Meta:
        model = LabTest
        fields = [
            "id", "patient", "patient_name", "patient_mrn",
            "ordered_by", "doctor_name",
            "consultation",
            "test_type", "test_type_display",
            "urgency", "urgency_display",
            "status", "status_display",
            "requested_at", "completed_at",
            "flagged", "is_terminal", "is_critical",
            "created_at",
        ]
        read_only_fields = fields

    def get_doctor_name(self, obj: LabTest) -> str:
        try:
            return obj.ordered_by.staff.full_name
        except AttributeError:
            return ""


# ─────────────────────────────────────────────────────────────────────────────
# LabTest Detail
# ─────────────────────────────────────────────────────────────────────────────

class LabTestDetailSerializer(LabTestListSerializer):
    """Extends list serializer with key_findings and nested report files."""
    report_files = LabReportFileSerializer(
        many=True, source="report_files.all", read_only=True,
    )

    class Meta(LabTestListSerializer.Meta):
        fields = LabTestListSerializer.Meta.fields + [
            "key_findings",
            "report_files",
        ]
        read_only_fields = fields


# ─────────────────────────────────────────────────────────────────────────────
# LabTest Write
# ─────────────────────────────────────────────────────────────────────────────

class LabTestWriteSerializer(serializers.ModelSerializer):
    """Create a new lab test order."""
    from apps.people.models import Doctor as _Doctor  # noqa: PLC0415
    from apps.people.models import Patient as _Patient  # noqa: PLC0415

    patient = serializers.PrimaryKeyRelatedField(
        queryset=_Patient.objects.all(),  # type: ignore[attr-defined]
    )
    ordered_by = serializers.PrimaryKeyRelatedField(
        queryset=_Doctor.objects.all(),  # type: ignore[attr-defined]
    )
    consultation = serializers.PrimaryKeyRelatedField(
        queryset=__import__(
            "apps.consultations.models", fromlist=["Consultation"]
        ).Consultation.objects.all(),
        required=False,
        allow_null=True,
    )
    test_type = serializers.ChoiceField(choices=TEST_TYPE_CHOICES)
    urgency = serializers.ChoiceField(choices=URGENCY_CHOICES, default=URGENCY_ROUTINE)
    notes = serializers.CharField(
        required=False, allow_blank=True, default="",
        help_text="Initial ordering notes (not stored on model, passed to service).",
    )

    class Meta:
        model = LabTest
        fields = ["patient", "ordered_by", "consultation", "test_type", "urgency", "notes"]


# ─────────────────────────────────────────────────────────────────────────────
# Action Serializers
# ─────────────────────────────────────────────────────────────────────────────

class StatusUpdateSerializer(serializers.Serializer):
    """Input for PATCH (status update) on a lab test."""
    new_status = serializers.ChoiceField(choices=LAB_STATUS_CHOICES)
    key_findings = serializers.CharField(required=False, allow_blank=True, default="")


class FlagSerializer(serializers.Serializer):
    """Input for POST /flag/ action."""
    reason = serializers.CharField(required=False, allow_blank=True, default="")


# ─────────────────────────────────────────────────────────────────────────────
# TestMaster, LabOrder, LabOrderItem, LabReport
# ─────────────────────────────────────────────────────────────────────────────
from apps.laboratory.models import TestMaster, LabOrder, LabOrderItem, LabReport

class TestMasterSerializer(serializers.ModelSerializer):
    """Serializer for TestMaster database catalog records."""
    class Meta:
        model = TestMaster
        fields = [
            "id", "name", "code", "category", "normal_range",
            "unit", "price", "turnaround_hours", "is_active",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class LabReportSerializer(serializers.ModelSerializer):
    """Serializer for uploaded Lab Reports."""
    uploaded_by_name = serializers.CharField(source="uploaded_by.username", read_only=True)

    class Meta:
        model = LabReport
        fields = [
            "id", "lab_order", "report_file", "uploaded_by",
            "uploaded_by_name", "uploaded_at", "doctor_comment",
            "reviewed_at", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "uploaded_by", "uploaded_at", "created_at", "updated_at"]


class LabOrderItemSerializer(serializers.ModelSerializer):
    """Serializer for LabOrderItem (individual ordered test results)."""
    test_name = serializers.CharField(source="test.name", read_only=True)
    test_code = serializers.CharField(source="test.code", read_only=True)
    test_category = serializers.CharField(source="test.category", read_only=True)
    test_normal_range = serializers.CharField(source="test.normal_range", read_only=True)
    test_unit = serializers.CharField(source="test.unit", read_only=True)

    class Meta:
        model = LabOrderItem
        fields = [
            "id", "lab_order", "test", "test_name", "test_code",
            "test_category", "test_normal_range", "test_unit",
            "result_value", "result_note", "is_abnormal",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class LabOrderSerializer(serializers.ModelSerializer):
    """Detail read serializer for LabOrder."""
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    doctor_name = serializers.CharField(source="doctor.staff.full_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    items = LabOrderItemSerializer(many=True, read_only=True)
    reports = LabReportSerializer(many=True, read_only=True)

    class Meta:
        model = LabOrder
        fields = [
            "id", "consultation", "patient", "patient_name", "patient_mrn",
            "doctor", "doctor_name", "status", "status_display",
            "clinical_note", "ordered_at", "completed_at",
            "items", "reports", "created_at", "updated_at"
        ]
        read_only_fields = fields


class LabOrderWriteSerializer(serializers.ModelSerializer):
    """Write serializer for creating grouped lab orders with multiple items."""
    from apps.people.models import Patient as _Patient  # noqa: PLC0415
    from apps.people.models import Doctor as _Doctor  # noqa: PLC0415
    from apps.consultations.models import Consultation as _Consultation  # noqa: PLC0415

    patient = serializers.PrimaryKeyRelatedField(queryset=_Patient.objects.all())
    doctor = serializers.PrimaryKeyRelatedField(queryset=_Doctor.objects.all())
    consultation = serializers.PrimaryKeyRelatedField(
        queryset=_Consultation.objects.all(),
        required=False,
        allow_null=True
    )
    tests = serializers.PrimaryKeyRelatedField(
        queryset=TestMaster.objects.filter(is_active=True),
        many=True,
        write_only=True
    )

    class Meta:
        model = LabOrder
        fields = ["consultation", "patient", "doctor", "clinical_note", "tests"]


class LabReportUploadInputSerializer(serializers.Serializer):
    """Serializer mapping fields for uploaded report PDFs."""
    file = serializers.FileField(help_text="Lab report PDF file.")


class LabOrderReviewSerializer(serializers.ModelSerializer):
    """Serializer mapping fields for adding comments."""
    class Meta:
        model = LabReport
        fields = ["doctor_comment"]

