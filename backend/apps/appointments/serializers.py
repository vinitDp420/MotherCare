"""
MotherCare — Appointments Module Serializers
"""
from __future__ import annotations

from datetime import datetime

from rest_framework import serializers

from apps.appointments.constants import (
    TERMINAL_STATUSES,
)
from apps.appointments.models import Appointment

# ─────────────────────────────────────────────────────────────────────────────
# Stubs
# ─────────────────────────────────────────────────────────────────────────────

class PatientStubSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    mrn = serializers.CharField()
    full_name = serializers.CharField()
    phone = serializers.CharField()


class DoctorStubSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    specialisation = serializers.CharField()
    registration_no = serializers.CharField()
    staff_name = serializers.SerializerMethodField()

    def get_staff_name(self, obj: object) -> str:
        try:
            return obj.staff.full_name  # type: ignore[union-attr]
        except AttributeError:
            return ""


# ─────────────────────────────────────────────────────────────────────────────
# List serializer
# ─────────────────────────────────────────────────────────────────────────────

class AppointmentListSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    doctor_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    type_display = serializers.CharField(source="get_appointment_type_display", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id", "patient", "patient_name", "patient_mrn",
            "doctor", "doctor_name",
            "appointment_datetime", "appointment_type", "type_display",
            "token_number", "status", "status_display",
            "notes", "created_at",
        ]
        read_only_fields = fields

    def get_doctor_name(self, obj: Appointment) -> str:
        try:
            return obj.doctor.staff.full_name
        except AttributeError:
            return ""


# ─────────────────────────────────────────────────────────────────────────────
# Detail serializer
# ─────────────────────────────────────────────────────────────────────────────

class AppointmentDetailSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    patient_blood_group = serializers.CharField(source="patient.blood_group", read_only=True)
    doctor_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    type_display = serializers.CharField(source="get_appointment_type_display", read_only=True)
    booked_by_name = serializers.SerializerMethodField()
    appointment_date = serializers.DateField(read_only=True)
    is_terminal = serializers.SerializerMethodField()
    has_consultation = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id",
            "patient", "patient_name", "patient_mrn", "patient_blood_group",
            "doctor", "doctor_name",
            "appointment_datetime", "appointment_date",
            "appointment_type", "type_display",
            "token_number", "status", "status_display",
            "is_terminal", "has_consultation",
            "notes",
            "booked_by", "booked_by_name",
            "is_deleted", "deleted_at",
            "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_doctor_name(self, obj: Appointment) -> str:
        try:
            return obj.doctor.staff.full_name
        except AttributeError:
            return ""

    def get_booked_by_name(self, obj: Appointment) -> str:
        if obj.booked_by:
            return obj.booked_by.get_full_name() or obj.booked_by.username
        return ""

    def get_is_terminal(self, obj: Appointment) -> bool:
        return obj.status in TERMINAL_STATUSES

    def get_has_consultation(self, obj: Appointment) -> bool:
        return hasattr(obj, "consultation") and obj.consultation is not None


# ─────────────────────────────────────────────────────────────────────────────
# Write serializer
# ─────────────────────────────────────────────────────────────────────────────

class AppointmentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            "patient", "doctor",
            "appointment_datetime", "appointment_type", "notes",
        ]

    def validate_appointment_datetime(self, value: datetime) -> datetime:
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError(
                "Appointment datetime must be in the future."
            )
        return value

    def validate(self, data: dict) -> dict:
        # Validate doctor is active
        doctor = data.get("doctor")
        if doctor and hasattr(doctor, "staff") and not doctor.staff.is_active:
            raise serializers.ValidationError(
                {"doctor": "Cannot book with an inactive doctor."}
            )
        return data
