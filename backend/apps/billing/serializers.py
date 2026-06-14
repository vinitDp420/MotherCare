"""
MotherCare — Billing Module Serializers
"""
from rest_framework import serializers
from apps.billing.models import Bill, BillItem, BillPayment

class BillItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillItem
        fields = [
            "id",
            "bill",
            "item_type",
            "item_name",
            "reference_id",
            "quantity",
            "unit_price",
            "total_price",
            "sort_order",
            "created_at",
        ]
        read_only_fields = ["id", "total_price", "created_at"]


class BillItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillItem
        fields = [
            "item_type",
            "item_name",
            "reference_id",
            "quantity",
            "unit_price",
            "sort_order",
        ]


class BillPaymentSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source="recorded_by.full_name", read_only=True)

    class Meta:
        model = BillPayment
        fields = [
            "id",
            "bill",
            "amount",
            "payment_method",
            "transaction_ref",
            "paid_at",
            "recorded_by",
            "recorded_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "recorded_by", "created_at"]


class BillListSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    bill_type_display = serializers.CharField(source="get_bill_type_display", read_only=True)
    payment_status_display = serializers.CharField(source="get_payment_status_display", read_only=True)

    class Meta:
        model = Bill
        fields = [
            "id",
            "patient",
            "patient_name",
            "patient_mrn",
            "bill_type",
            "bill_type_display",
            "admission",
            "invoice_number",
            "total_amount",
            "amount_paid",
            "payment_status",
            "payment_status_display",
            "generated_at",
            "created_at",
        ]


class BillDetailSerializer(BillListSerializer):
    items = BillItemSerializer(many=True, read_only=True)
    payments = BillPaymentSerializer(many=True, read_only=True)

    class Meta(BillListSerializer.Meta):
        fields = BillListSerializer.Meta.fields + ["notes", "items", "payments"]


class BillWriteSerializer(serializers.ModelSerializer):
    items = BillItemWriteSerializer(many=True, required=False)

    class Meta:
        model = Bill
        fields = [
            "patient",
            "bill_type",
            "admission",
            "notes",
            "items",
        ]


class PaymentRecordSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    payment_method = serializers.ChoiceField(choices=BillPayment.PAYMENT_METHOD_CHOICES)
    transaction_ref = serializers.CharField(required=False, allow_blank=True)
