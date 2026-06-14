"""
MotherCare — Consultations Module Serializers
"""
from __future__ import annotations

from datetime import datetime

from rest_framework import serializers

from apps.consultations.constants import (
    CONSULTATION_TERMINAL_STATUSES,
)
from apps.consultations.models import Consultation


class ConsultationListSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    doctor_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Consultation
        fields = [
            "id", "appointment",
            "patient", "patient_name", "patient_mrn",
            "doctor", "doctor_name",
            "start_time", "end_time", "duration_minutes",
            "status", "status_display",
            "created_at",
        ]
        read_only_fields = fields

    def get_doctor_name(self, obj: Consultation) -> str:
        try:
            return obj.doctor.staff.full_name
        except AttributeError:
            return ""


class ConsultationDetailSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    patient_blood_group = serializers.CharField(source="patient.blood_group", read_only=True)
    patient_dob = serializers.DateField(source="patient.dob", read_only=True)
    doctor_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)
    is_terminal = serializers.BooleanField(read_only=True)
    appointment_type = serializers.CharField(
        source="appointment.get_appointment_type_display", read_only=True,
    )
    appointment_token = serializers.IntegerField(source="appointment.token_number", read_only=True)
    previous_prescriptions = serializers.SerializerMethodField()
    patient_allergies = serializers.SerializerMethodField()
    active_pregnancy = serializers.SerializerMethodField()

    class Meta:
        model = Consultation
        fields = [
            "id", "appointment", "appointment_type", "appointment_token",
            "patient", "patient_name", "patient_mrn", "patient_blood_group", "patient_dob",
            "doctor", "doctor_name",
            "start_time", "end_time", "duration_minutes",
            "status", "status_display", "is_terminal",
            "clinical_notes", "diagnosis",
            "follow_up_datetime",
            "previous_prescriptions", "patient_allergies", "active_pregnancy",
            "is_deleted", "deleted_at",
            "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_doctor_name(self, obj: Consultation) -> str:
        try:
            return obj.doctor.staff.full_name
        except AttributeError:
            return ""

    def get_previous_prescriptions(self, obj: Consultation) -> list[dict]:
        from apps.consultations.services import get_previous_prescriptions
        return get_previous_prescriptions(obj.patient, limit=5)

    def get_patient_allergies(self, obj: Consultation) -> list[dict]:
        """Surface allergy alerts in consultation workspace (BR-CONS-04)."""
        try:
            allergies = obj.patient.allergies.values(
                "allergen", "severity", "reaction_type"
            ).order_by("-severity")
            return list(allergies)
        except Exception:  # noqa: BLE001
            return []

    def get_active_pregnancy(self, obj: Consultation) -> dict | None:
        """Current pregnancy details for consultation context (BR-CONS-04)."""
        try:
            pregnancy = obj.patient.pregnancies.filter(is_active=True).first()
            if pregnancy:
                return {
                    "id": str(pregnancy.id),
                    "current_week": pregnancy.current_week,
                    "trimester": pregnancy.trimester,
                    "edd": str(pregnancy.edd),
                    "risk_status": pregnancy.risk_status,
                    "gravida": pregnancy.gravida,
                    "para": pregnancy.para,
                }
        except Exception:  # noqa: BLE001
            pass
        return None


class ConsultationWriteSerializer(serializers.ModelSerializer):
    """Create consultation from an appointment."""
    appointment = serializers.PrimaryKeyRelatedField(
        queryset=__import__("apps.appointments.models", fromlist=["Appointment"]).Appointment.objects.all()
    )
    clinical_notes = serializers.CharField(required=False, allow_blank=True, default="")
    diagnosis = serializers.CharField(required=False, allow_blank=True, default="")

    class Meta:
        model = Consultation
        fields = ["appointment", "clinical_notes", "diagnosis"]

    def validate_appointment(self, appointment: object) -> object:
        from apps.appointments.constants import STATUS_CONFIRMED, STATUS_IN_PROGRESS
        if appointment.status not in {STATUS_CONFIRMED, STATUS_IN_PROGRESS}:
            raise serializers.ValidationError(
                f"Cannot create consultation for appointment in '{appointment.status}' status. "
                "Appointment must be 'confirmed' or 'in_progress'. [BR-CONS-02]"
            )
        if hasattr(appointment, "consultation") and appointment.consultation is not None:
            raise serializers.ValidationError(
                "This appointment already has a consultation. [BR-CONS-01]"
            )
        return appointment


class ConsultationUpdateSerializer(serializers.ModelSerializer):
    """Update clinical notes / diagnosis for an in_progress consultation."""

    class Meta:
        model = Consultation
        fields = ["clinical_notes", "diagnosis"]

    def validate(self, data: dict) -> dict:
        if self.instance and self.instance.status in CONSULTATION_TERMINAL_STATUSES:
            raise serializers.ValidationError(
                f"Cannot edit a {self.instance.status} consultation. "
                "Completed consultations are immutable. [BR-CONS-07]"
            )
        return data


class CompleteConsultationSerializer(serializers.Serializer):
    """Input for completing a consultation."""
    clinical_notes = serializers.CharField(required=False, allow_blank=True)
    diagnosis = serializers.CharField(required=False, allow_blank=True)


class FollowUpSerializer(serializers.Serializer):
    """Input for scheduling a follow-up appointment."""
    follow_up_datetime = serializers.DateTimeField()
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_follow_up_datetime(self, value: datetime) -> datetime:
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError("Follow-up datetime must be in the future.")
        return value
