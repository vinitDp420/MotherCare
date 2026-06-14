"""
MotherCare — Newborn Module Serializers
"""
from rest_framework import serializers
from apps.newborn.models import Newborn, NewbornVaccination, NewbornFeedingLog, NewbornVital
from apps.newborn.constants import (
    NEWBORN_GENDER_CHOICES,
    NEWBORN_CONDITION_CHOICES,
    FEED_TYPE_CHOICES,
    VACCINE_STATUS_CHOICES,
)

class NewbornVaccinationSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = NewbornVaccination
        fields = [
            "id",
            "newborn",
            "vaccine_name",
            "dose_number",
            "status",
            "status_display",
            "administered_date",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class NewbornFeedingLogSerializer(serializers.ModelSerializer):
    newborn = serializers.PrimaryKeyRelatedField(queryset=Newborn.objects.all(), required=False)
    feed_type_display = serializers.CharField(source="get_feed_type_display", read_only=True)

    class Meta:
        model = NewbornFeedingLog
        fields = [
            "id",
            "newborn",
            "feed_type",
            "feed_type_display",
            "feed_time",
            "volume_ml",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        feed_type = attrs.get("feed_type")
        volume_ml = attrs.get("volume_ml")

        if feed_type in ["formula", "ng_tube", "iv"] and volume_ml is None:
            raise serializers.ValidationError(
                {"volume_ml": f"Volume in ml is required for {feed_type} feeds."}
            )
        return attrs


class NewbornVitalSerializer(serializers.ModelSerializer):
    newborn = serializers.PrimaryKeyRelatedField(queryset=Newborn.objects.all(), required=False)
    recorded_by_name = serializers.CharField(source="recorded_by.full_name", read_only=True)

    class Meta:
        model = NewbornVital
        fields = [
            "id",
            "newborn",
            "recorded_at",
            "weight_kg",
            "head_circ_cm",
            "temperature",
            "notes",
            "recorded_by",
            "recorded_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "recorded_by", "created_at"]


class NewbornListSerializer(serializers.ModelSerializer):
    gender_display = serializers.CharField(source="get_gender_display", read_only=True)
    condition_display = serializers.CharField(source="get_condition_display", read_only=True)
    mother_name = serializers.CharField(source="delivery.patient.full_name", read_only=True)
    mother_mrn = serializers.CharField(source="delivery.patient.mrn", read_only=True)

    class Meta:
        model = Newborn
        fields = [
            "id",
            "delivery",
            "baby_mrn",
            "gender",
            "gender_display",
            "birth_weight_kg",
            "birth_length_cm",
            "apgar_1min",
            "apgar_5min",
            "condition",
            "condition_display",
            "nicu_required",
            "mother_name",
            "mother_mrn",
            "created_at",
        ]


class NewbornDetailSerializer(NewbornListSerializer):
    vaccinations = NewbornVaccinationSerializer(many=True, read_only=True)
    feeding_logs = NewbornFeedingLogSerializer(many=True, read_only=True)
    vitals = NewbornVitalSerializer(many=True, read_only=True)

    class Meta(NewbornListSerializer.Meta):
        fields = NewbornListSerializer.Meta.fields + ["notes", "vaccinations", "feeding_logs", "vitals"]


class NewbornWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Newborn
        fields = [
            "delivery",
            "gender",
            "birth_weight_kg",
            "birth_length_cm",
            "apgar_1min",
            "apgar_5min",
            "condition",
            "nicu_required",
            "notes",
        ]

    def validate_apgar_1min(self, value):
        if not (0 <= value <= 10):
            raise serializers.ValidationError("APGAR score must be between 0 and 10.")
        return value

    def validate_apgar_5min(self, value):
        if not (0 <= value <= 10):
            raise serializers.ValidationError("APGAR score must be between 0 and 10.")
        return value
