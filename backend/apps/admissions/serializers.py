"""
MotherCare — Admissions & Bed Management Serializers
"""
from rest_framework import serializers
from apps.admissions.models import Bed, Admission, WardTransfer
from apps.people.models import Patient, Doctor
from apps.admissions.constants import (
    WARD_TYPE_CHOICES,
    BED_STATUS_CHOICES,
    ADMISSION_STATUS_CHOICES,
    ADMISSION_TYPE_CHOICES,
)

class BedSerializer(serializers.ModelSerializer):
    ward_type_display = serializers.CharField(source="get_ward_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Bed
        fields = [
            "id",
            "bed_number",
            "ward_type",
            "ward_type_display",
            "status",
            "status_display",
            "floor",
            "last_cleaned_at",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "last_cleaned_at", "created_at", "updated_at"]


class WardTransferSerializer(serializers.ModelSerializer):
    from_bed_number = serializers.CharField(source="from_bed.bed_number", read_only=True)
    to_bed_number = serializers.CharField(source="to_bed.bed_number", read_only=True)
    transferred_by_name = serializers.CharField(source="transferred_by.full_name", read_only=True)

    class Meta:
        model = WardTransfer
        fields = [
            "id",
            "admission",
            "from_bed",
            "from_bed_number",
            "to_bed",
            "to_bed_number",
            "transferred_at",
            "reason",
            "transferred_by",
            "transferred_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "from_bed", "transferred_at", "transferred_by", "created_at"]


class AdmissionListSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    doctor_name = serializers.CharField(source="doctor.staff.full_name", read_only=True)
    bed_number = serializers.CharField(source="bed.bed_number", read_only=True)
    ward_type = serializers.CharField(source="bed.ward_type", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    admission_type_display = serializers.CharField(source="get_admission_type_display", read_only=True)

    class Meta:
        model = Admission
        fields = [
            "id",
            "patient",
            "patient_name",
            "patient_mrn",
            "bed",
            "bed_number",
            "ward_type",
            "doctor",
            "doctor_name",
            "status",
            "status_display",
            "admission_type",
            "admission_type_display",
            "admitted_at",
            "est_discharge",
            "actual_discharge",
            "created_at",
        ]


class AdmissionDetailSerializer(AdmissionListSerializer):
    transfers = WardTransferSerializer(many=True, read_only=True)

    class Meta(AdmissionListSerializer.Meta):
        fields = AdmissionListSerializer.Meta.fields + ["notes", "transfers"]


class AdmissionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admission
        fields = [
            "patient",
            "bed",
            "doctor",
            "admission_type",
            "est_discharge",
            "notes",
        ]

    def validate_bed(self, value):
        if value.status != "available":
            raise serializers.ValidationError("This bed is not available.")
        return value


class TransferWardSerializer(serializers.Serializer):
    to_bed = serializers.PrimaryKeyRelatedField(queryset=Bed.objects.all())
    reason = serializers.CharField(required=False, allow_blank=True)


class DischargeSerializer(serializers.Serializer):
    actual_discharge = serializers.DateTimeField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=[("discharged", "Discharged"), ("deceased", "Deceased")], default="discharged")
    notes = serializers.CharField(required=False, allow_blank=True)
