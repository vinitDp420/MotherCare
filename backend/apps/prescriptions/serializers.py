"""
MotherCare — Prescriptions Module Serializers
"""
from __future__ import annotations

from rest_framework import serializers

from apps.prescriptions.models import Prescription, PrescriptionItem

# ─────────────────────────────────────────────────────────────────────────────
# Nested stubs
# ─────────────────────────────────────────────────────────────────────────────

class MedicineStubSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField(read_only=True)
    generic_name = serializers.CharField(read_only=True)
    category = serializers.CharField(read_only=True)
    unit = serializers.CharField(read_only=True)


# ─────────────────────────────────────────────────────────────────────────────
# PrescriptionItem
# ─────────────────────────────────────────────────────────────────────────────

class PrescriptionItemSerializer(serializers.ModelSerializer):
    """Read serializer — used in Prescription detail view."""
    medicine = MedicineStubSerializer(read_only=True)
    frequency_display = serializers.CharField(source="get_frequency_display", read_only=True)

    class Meta:
        model = PrescriptionItem
        fields = [
            "id", "prescription", "medicine",
            "dosage", "frequency", "frequency_display",
            "duration", "instructions", "sort_order",
            "created_at",
        ]
        read_only_fields = fields


class PrescriptionItemWriteSerializer(serializers.ModelSerializer):
    """Write serializer for individual prescription items."""
    from apps.pharmacy.models import Medicine as _Medicine  # noqa: PLC0415

    medicine = serializers.PrimaryKeyRelatedField(
        queryset=_Medicine.objects.all(),  # type: ignore[attr-defined]
    )
    prescription = serializers.PrimaryKeyRelatedField(
        queryset=Prescription.objects.all(),
        required=False,
    )

    class Meta:
        model = PrescriptionItem
        fields = [
            "prescription", "medicine", "dosage",
            "frequency", "duration", "instructions", "sort_order",
        ]

    def validate_medicine(self, medicine: object) -> object:
        if not medicine.is_active:
            raise serializers.ValidationError(
                f"Medicine '{medicine.name}' is inactive and cannot be prescribed. "
                "[BR-PHARM-01]"
            )
        return medicine


# ─────────────────────────────────────────────────────────────────────────────
# Prescription List
# ─────────────────────────────────────────────────────────────────────────────

class PrescriptionListSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = [
            "id", "consultation", "patient", "patient_name", "patient_mrn",
            "issued_at", "notes", "item_count", "created_at",
        ]
        read_only_fields = fields

    def get_item_count(self, obj: Prescription) -> int:
        return obj.items.count()


# ─────────────────────────────────────────────────────────────────────────────
# Prescription Detail
# ─────────────────────────────────────────────────────────────────────────────

class PrescriptionDetailSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    patient_blood_group = serializers.CharField(source="patient.blood_group", read_only=True)
    item_count = serializers.SerializerMethodField()
    items = PrescriptionItemSerializer(many=True, source="items.all", read_only=True)

    class Meta:
        model = Prescription
        fields = [
            "id", "consultation", "patient", "patient_name", "patient_mrn",
            "patient_blood_group",
            "issued_at", "notes", "item_count", "items", "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_item_count(self, obj: Prescription) -> int:
        return obj.items.count()


# ─────────────────────────────────────────────────────────────────────────────
# Prescription Write
# ─────────────────────────────────────────────────────────────────────────────

class PrescriptionWriteSerializer(serializers.ModelSerializer):
    """Create a full prescription (header + items) in one request."""
    from apps.consultations.models import Consultation as _Consultation  # noqa: PLC0415
    from apps.people.models import Patient as _Patient  # noqa: PLC0415

    consultation = serializers.PrimaryKeyRelatedField(
        queryset=_Consultation.objects.all(),  # type: ignore[attr-defined]
    )
    patient = serializers.PrimaryKeyRelatedField(
        queryset=_Patient.objects.all(),  # type: ignore[attr-defined]
    )
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    items = PrescriptionItemWriteSerializer(many=True, required=False, default=list)

    class Meta:
        model = Prescription
        fields = ["consultation", "patient", "notes", "items"]

    def validate_consultation(self, consultation: object) -> object:
        from apps.consultations.constants import CONS_STATUS_CANCELLED
        if consultation.status == CONS_STATUS_CANCELLED:
            raise serializers.ValidationError(
                "Cannot prescribe for a cancelled consultation. [BR-RX-02]"
            )
        return consultation
