from rest_framework import serializers
from apps.referrals.models import StitchFile
from apps.laboratory.models import LabReport
from apps.prescriptions.models import Prescription
from apps.laboratory.serializers import LabReportSerializer
from apps.prescriptions.serializers import PrescriptionListSerializer


class StitchFileSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)

    attached_reports = LabReportSerializer(many=True, read_only=True)
    attached_prescriptions = PrescriptionListSerializer(many=True, read_only=True)

    attached_report_ids = serializers.PrimaryKeyRelatedField(
        queryset=LabReport.objects.all(),
        many=True,
        write_only=True,
        source="attached_reports",
        required=False
    )
    attached_prescription_ids = serializers.PrimaryKeyRelatedField(
        queryset=Prescription.objects.all(),
        many=True,
        write_only=True,
        source="attached_prescriptions",
        required=False
    )

    class Meta:
        model = StitchFile
        fields = [
            "id", "patient", "patient_name", "patient_mrn",
            "created_by", "created_by_name",
            "specialist_type", "urgency", "reason", "referral_note",
            "attached_reports", "attached_prescriptions",
            "attached_report_ids", "attached_prescription_ids",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]
