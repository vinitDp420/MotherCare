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
            "duration", "duration_days", "route", "quantity_to_dispense",
            "instructions", "sort_order",
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
            "frequency", "duration", "duration_days", "route",
            "quantity_to_dispense", "instructions", "sort_order",
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
    doctor_name = serializers.CharField(source="doctor.staff.full_name", read_only=True, default="")
    item_count = serializers.SerializerMethodField()
    is_dispensed = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = [
            "id", "consultation", "patient", "patient_name", "patient_mrn",
            "doctor", "doctor_name", "status",
            "issued_at", "notes", "item_count", "is_dispensed", "created_at",
        ]
        read_only_fields = fields

    def get_item_count(self, obj: Prescription) -> int:
        return obj.items.count()

    def get_is_dispensed(self, obj: Prescription) -> bool:
        return obj.pharmacy_sales.exists()


# ─────────────────────────────────────────────────────────────────────────────
# Prescription Detail
# ─────────────────────────────────────────────────────────────────────────────

class PrescriptionDetailSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    patient_blood_group = serializers.CharField(source="patient.blood_group", read_only=True)
    patient_age = serializers.SerializerMethodField()
    doctor_name = serializers.CharField(source="doctor.staff.full_name", read_only=True, default="")
    doctor_registration_no = serializers.CharField(source="doctor.registration_no", read_only=True, default="")
    item_count = serializers.SerializerMethodField()
    items = PrescriptionItemSerializer(many=True, source="items.all", read_only=True)
    is_dispensed = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = [
            "id", "consultation", "patient", "patient_name", "patient_mrn",
            "patient_blood_group", "patient_age", "doctor", "doctor_name", "doctor_registration_no",
            "status", "issued_at", "notes", "item_count", "items", "is_dispensed", "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_item_count(self, obj: Prescription) -> int:
        return obj.items.count()

    def get_is_dispensed(self, obj: Prescription) -> bool:
        return obj.pharmacy_sales.exists()

    def get_patient_age(self, obj: Prescription) -> int | None:
        if not obj.patient or not obj.patient.dob:
            return None
        from datetime import date
        today = date.today()
        dob = obj.patient.dob
        return today.year - dob.year - (
            (today.month, today.day) < (dob.month, dob.day)
        )


# ─────────────────────────────────────────────────────────────────────────────
# Prescription Write
# ─────────────────────────────────────────────────────────────────────────────

class PrescriptionWriteSerializer(serializers.ModelSerializer):
    """Create a full prescription (header + items) in one request."""
    from apps.consultations.models import Consultation as _Consultation  # noqa: PLC0415
    from apps.people.models import Patient as _Patient  # noqa: PLC0415
    from apps.people.models import Doctor as _Doctor  # noqa: PLC0415

    consultation = serializers.PrimaryKeyRelatedField(
        queryset=_Consultation.objects.all(),  # type: ignore[attr-defined]
    )
    patient = serializers.PrimaryKeyRelatedField(
        queryset=_Patient.objects.all(),  # type: ignore[attr-defined]
    )
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=_Doctor.objects.all(),
        required=False,
        allow_null=True,
    )
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    status = serializers.ChoiceField(
        choices=[("draft", "Draft"), ("saved", "Saved"), ("dispensed", "Dispensed")],
        default="saved",
        required=False,
    )
    items = PrescriptionItemWriteSerializer(many=True, required=False, default=list)

    class Meta:
        model = Prescription
        fields = ["consultation", "patient", "doctor", "status", "notes", "items"]

    def validate_consultation(self, consultation: object) -> object:
        from apps.consultations.constants import CONS_STATUS_CANCELLED
        if consultation.status == CONS_STATUS_CANCELLED:
            raise serializers.ValidationError(
                "Cannot prescribe for a cancelled consultation. [BR-RX-02]"
            )
        return consultation
