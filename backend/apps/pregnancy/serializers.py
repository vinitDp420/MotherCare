"""
MotherCare — Pregnancy Module Serializers
Architecture: CLAUDE.md — "Serializers: validation and representation only"

Serializer variants:
    Pregnancy:
        PregnancyListSerializer    — compact list view
        PregnancyDetailSerializer  — full detail with nested sub-resources
        PregnancyWriteSerializer   — create / update input

    AncVisit:
        AncVisitSerializer         — read + write (single serializer OK for this entity)
        AncVisitWriteSerializer    — validated write input

    PregnancyRiskEvent:
        RiskEventSerializer
        RiskEventWriteSerializer

    Vaccination:
        VaccinationSerializer
        VaccinationWriteSerializer

    WellnessPlan:
        WellnessPlanSerializer
        WellnessPlanWriteSerializer
"""
from __future__ import annotations

from datetime import date

from rest_framework import serializers

from apps.pregnancy.constants import (
    GESTATIONAL_WEEK_MAX,
    GESTATIONAL_WEEK_MIN,
    VACC_STATUS_ADMINISTERED,
)
from apps.pregnancy.models import (
    AncVisit,
    Pregnancy,
    PregnancyRiskEvent,
    Vaccination,
    WellnessPlan,
)

# ─────────────────────────────────────────────────────────────────────────────
# Nested read-only stubs (for detail serializer)
# ─────────────────────────────────────────────────────────────────────────────

class PatientStubSerializer(serializers.Serializer):
    """Minimal patient representation for nesting in pregnancy responses."""
    id = serializers.UUIDField()
    mrn = serializers.CharField()
    full_name = serializers.CharField()
    blood_group = serializers.CharField()
    dob = serializers.DateField()


class DoctorStubSerializer(serializers.Serializer):
    """Minimal doctor representation for nesting."""
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
# ANC Visit Serializers
# ─────────────────────────────────────────────────────────────────────────────

class AncVisitSerializer(serializers.ModelSerializer):
    """Full ANC visit read serializer."""
    doctor_name = serializers.SerializerMethodField()
    visit_type_display = serializers.CharField(source="get_visit_type_display", read_only=True)

    class Meta:
        model = AncVisit
        fields = [
            "id", "pregnancy", "doctor", "doctor_name",
            "visit_date", "week_at_visit", "visit_type", "visit_type_display",
            "bp_systolic", "bp_diastolic", "weight_kg",
            "fhr_bpm", "glucose_mgdl", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "doctor_name", "visit_type_display"]

    def get_doctor_name(self, obj: AncVisit) -> str:
        try:
            return obj.doctor.staff.full_name
        except AttributeError:
            return ""


class AncVisitWriteSerializer(serializers.ModelSerializer):
    """ANC visit create / update serializer."""

    class Meta:
        model = AncVisit
        fields = [
            "doctor", "visit_date", "week_at_visit", "visit_type",
            "bp_systolic", "bp_diastolic", "weight_kg",
            "fhr_bpm", "glucose_mgdl", "notes",
        ]

    def validate_visit_date(self, value: date) -> date:
        if value > date.today():
            raise serializers.ValidationError("ANC visit date cannot be in the future.")
        return value

    def validate_week_at_visit(self, value: int) -> int:
        if not (GESTATIONAL_WEEK_MIN <= value <= GESTATIONAL_WEEK_MAX):
            raise serializers.ValidationError(
                f"Gestational week must be between {GESTATIONAL_WEEK_MIN} and {GESTATIONAL_WEEK_MAX}."
            )
        return value

    def validate(self, data: dict) -> dict:
        """Cross-field: diastolic < systolic."""
        systolic = data.get("bp_systolic")
        diastolic = data.get("bp_diastolic")
        if systolic and diastolic and diastolic >= systolic:
            raise serializers.ValidationError(
                {"bp_diastolic": "Diastolic pressure must be less than systolic pressure."}
            )
        return data


# ─────────────────────────────────────────────────────────────────────────────
# Risk Event Serializers
# ─────────────────────────────────────────────────────────────────────────────

class RiskEventSerializer(serializers.ModelSerializer):
    """Risk event read serializer."""
    risk_level_display = serializers.CharField(source="get_risk_level_display", read_only=True)
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PregnancyRiskEvent
        fields = [
            "id", "pregnancy", "event_date", "week_number",
            "risk_level", "risk_level_display", "event_description",
            "recorded_by", "recorded_by_name", "created_at",
        ]
        read_only_fields = ["id", "created_at", "risk_level_display", "recorded_by_name"]

    def get_recorded_by_name(self, obj: PregnancyRiskEvent) -> str:
        if obj.recorded_by:
            return obj.recorded_by.get_full_name() or obj.recorded_by.username
        return ""


class RiskEventWriteSerializer(serializers.ModelSerializer):
    """Risk event create serializer."""

    class Meta:
        model = PregnancyRiskEvent
        fields = ["event_date", "week_number", "risk_level", "event_description"]

    def validate_event_date(self, value: date) -> date:
        if value > date.today():
            raise serializers.ValidationError("Risk event date cannot be in the future.")
        return value


# ─────────────────────────────────────────────────────────────────────────────
# Vaccination Serializers
# ─────────────────────────────────────────────────────────────────────────────

class VaccinationSerializer(serializers.ModelSerializer):
    """Vaccination read serializer."""
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    administered_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Vaccination
        fields = [
            "id", "pregnancy", "vaccine_name", "status", "status_display",
            "due_week_start", "due_week_end",
            "administered_date", "administered_by", "administered_by_name",
            "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "status_display", "administered_by_name"]

    def get_administered_by_name(self, obj: Vaccination) -> str:
        if obj.administered_by:
            try:
                return obj.administered_by.staff.full_name
            except AttributeError:
                return ""
        return ""


class VaccinationWriteSerializer(serializers.ModelSerializer):
    """Vaccination create / update serializer."""

    class Meta:
        model = Vaccination
        fields = [
            "vaccine_name", "status", "due_week_start", "due_week_end",
            "administered_date", "administered_by", "notes",
        ]

    def validate(self, data: dict) -> dict:
        status = data.get("status", VACC_STATUS_ADMINISTERED)
        if status == VACC_STATUS_ADMINISTERED and not data.get("administered_date"):
            raise serializers.ValidationError(
                {"administered_date": "This field is required when status is 'administered'."}
            )
        due_start = data.get("due_week_start")
        due_end = data.get("due_week_end")
        if due_start and due_end and due_start > due_end:
            raise serializers.ValidationError(
                {"due_week_end": "due_week_end must be >= due_week_start."}
            )
        return data


# ─────────────────────────────────────────────────────────────────────────────
# Wellness Plan Serializers
# ─────────────────────────────────────────────────────────────────────────────

class WellnessPlanSerializer(serializers.ModelSerializer):
    """Wellness plan read serializer."""

    class Meta:
        model = WellnessPlan
        fields = [
            "id", "pregnancy", "dietary_protocol",
            "dietary_items", "daily_precautions",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class WellnessPlanWriteSerializer(serializers.ModelSerializer):
    """Wellness plan create / update serializer."""

    class Meta:
        model = WellnessPlan
        fields = ["dietary_protocol", "dietary_items", "daily_precautions"]


# ─────────────────────────────────────────────────────────────────────────────
# Pregnancy Serializers
# ─────────────────────────────────────────────────────────────────────────────

class PregnancyListSerializer(serializers.ModelSerializer):
    """
    Compact pregnancy list representation.
    Used for patient profile sidebar and pregnancy roster.
    """
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    doctor_name = serializers.SerializerMethodField()
    risk_status_display = serializers.CharField(source="get_risk_status_display", read_only=True)
    trimester_display = serializers.CharField(source="get_trimester_display", read_only=True)
    is_high_risk = serializers.BooleanField(read_only=True)

    class Meta:
        model = Pregnancy
        fields = [
            "id", "patient", "patient_name", "patient_mrn",
            "assigned_doctor", "doctor_name",
            "lmp", "edd", "current_week", "trimester", "trimester_display",
            "risk_status", "risk_status_display", "is_high_risk",
            "gravida", "para", "is_active",
            "created_at",
        ]
        read_only_fields = fields

    def get_doctor_name(self, obj: Pregnancy) -> str:
        if obj.assigned_doctor:
            try:
                return obj.assigned_doctor.staff.full_name
            except AttributeError:
                return ""
        return ""


class PregnancyDetailSerializer(serializers.ModelSerializer):
    """
    Full pregnancy detail with nested sub-resources.
    Used for single pregnancy detail view.
    """
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    patient_blood_group = serializers.CharField(source="patient.blood_group", read_only=True)
    doctor_name = serializers.SerializerMethodField()
    risk_status_display = serializers.CharField(source="get_risk_status_display", read_only=True)
    trimester_display = serializers.CharField(source="get_trimester_display", read_only=True)
    is_high_risk = serializers.BooleanField(read_only=True)

    # Nested sub-resources
    recent_anc_visits = serializers.SerializerMethodField()
    recent_risk_events = serializers.SerializerMethodField()
    vaccinations_summary = serializers.SerializerMethodField()
    wellness_plan = WellnessPlanSerializer(read_only=True)

    class Meta:
        model = Pregnancy
        fields = [
            "id", "patient", "patient_name", "patient_mrn", "patient_blood_group",
            "assigned_doctor", "doctor_name",
            "lmp", "edd", "current_week", "trimester", "trimester_display",
            "risk_status", "risk_status_display", "is_high_risk",
            "gravida", "para", "chronic_conditions", "is_active",
            "is_deleted", "deleted_at",
            "recent_anc_visits", "recent_risk_events",
            "vaccinations_summary", "wellness_plan",
            "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_doctor_name(self, obj: Pregnancy) -> str:
        if obj.assigned_doctor:
            try:
                return obj.assigned_doctor.staff.full_name
            except AttributeError:
                return ""
        return ""

    def get_recent_anc_visits(self, obj: Pregnancy) -> list[dict]:
        visits = obj.anc_visits.order_by("-visit_date")[:5]
        return AncVisitSerializer(visits, many=True).data

    def get_recent_risk_events(self, obj: Pregnancy) -> list[dict]:
        events = obj.risk_events.order_by("-event_date")[:5]
        return RiskEventSerializer(events, many=True).data

    def get_vaccinations_summary(self, obj: Pregnancy) -> dict:
        vaccinations = obj.vaccinations.all()
        return {
            "total": vaccinations.count(),
            "administered": vaccinations.filter(status="administered").count(),
            "due": vaccinations.filter(status="due").count(),
            "skipped": vaccinations.filter(status="skipped").count(),
        }


class PregnancyWriteSerializer(serializers.ModelSerializer):
    """
    Pregnancy create / update serializer.
    Validates LMP, EDD, and business rules before passing to service layer.
    """
    # edd is optional — if not provided, service calculates from LMP
    edd = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = Pregnancy
        fields = [
            "patient", "assigned_doctor",
            "lmp", "edd", "risk_status",
            "gravida", "para", "chronic_conditions", "is_active",
        ]

    def validate_lmp(self, value: date) -> date:
        if value > date.today():
            raise serializers.ValidationError(
                "LMP (Last Menstrual Period) cannot be in the future."
            )
        return value

    def validate_gravida(self, value: int) -> int:
        if value < 1:
            raise serializers.ValidationError("Gravida must be at least 1.")
        return value

    def validate_para(self, value: int) -> int:
        if value < 0:
            raise serializers.ValidationError("Para cannot be negative.")
        return value

    def validate(self, data: dict) -> dict:
        """Cross-field: EDD > LMP."""
        lmp = data.get("lmp")
        edd = data.get("edd")
        if lmp and edd and edd <= lmp:
            raise serializers.ValidationError(
                {"edd": "EDD (Estimated Due Date) must be after LMP."}
            )
        gravida = data.get("gravida", 1)
        para = data.get("para", 0)
        if para >= gravida:
            raise serializers.ValidationError(
                {"para": "Para cannot be equal to or greater than Gravida."}
            )
        return data
