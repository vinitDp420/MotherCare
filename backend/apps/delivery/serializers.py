"""
MotherCare — Delivery Module Serializers
"""
from rest_framework import serializers
from apps.delivery.models import Delivery, DeliveryProcedure
from apps.delivery.constants import DELIVERY_MODE_CHOICES

class DeliveryProcedureSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source="performed_by.staff.full_name", read_only=True)

    class Meta:
        model = DeliveryProcedure
        fields = [
            "id",
            "delivery",
            "performed_by",
            "performed_by_name",
            "procedure_name",
            "indication",
            "technique",
            "implants_used",
            "duration_minutes",
            "post_op_instructions",
            "performed_at",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class DeliveryProcedureWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryProcedure
        fields = [
            "performed_by",
            "procedure_name",
            "indication",
            "technique",
            "implants_used",
            "duration_minutes",
            "post_op_instructions",
            "performed_at",
        ]


class DeliveryListSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    doctor_name = serializers.CharField(source="doctor.staff.full_name", read_only=True)
    delivery_mode_display = serializers.CharField(source="get_delivery_mode_display", read_only=True)

    class Meta:
        model = Delivery
        fields = [
            "id",
            "admission",
            "patient",
            "patient_name",
            "patient_mrn",
            "doctor",
            "doctor_name",
            "delivery_datetime",
            "delivery_mode",
            "delivery_mode_display",
            "blood_loss_ml",
            "placenta_complete",
            "created_at",
        ]


class DeliveryDetailSerializer(DeliveryListSerializer):
    procedures = DeliveryProcedureSerializer(many=True, read_only=True)

    class Meta(DeliveryListSerializer.Meta):
        fields = DeliveryListSerializer.Meta.fields + ["complications", "notes", "procedures"]


class DeliveryWriteSerializer(serializers.ModelSerializer):
    procedures = DeliveryProcedureWriteSerializer(many=True, required=False)

    class Meta:
        model = Delivery
        fields = [
            "admission",
            "patient",
            "doctor",
            "delivery_datetime",
            "delivery_mode",
            "blood_loss_ml",
            "placenta_complete",
            "complications",
            "notes",
            "procedures",
        ]

    def validate(self, attrs):
        delivery_mode = attrs.get("delivery_mode")
        procedures = attrs.get("procedures", [])

        if delivery_mode == "c_section":
            has_c_section = any(p.get("procedure_name") == "Caesarean Section" for p in procedures)
            if not has_c_section:
                raise serializers.ValidationError(
                    {"procedures": "C-section deliveries require at least one 'Caesarean Section' procedure to be recorded."}
                )
        return attrs
