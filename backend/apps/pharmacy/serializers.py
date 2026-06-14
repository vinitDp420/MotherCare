"""
MotherCare — Pharmacy Module Serializers
"""
from rest_framework import serializers
from apps.pharmacy.models import Medicine, MedicineBatch, PharmacySale, PharmacySaleItem

class MedicineSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = Medicine
        fields = [
            "id",
            "name",
            "generic_name",
            "category",
            "category_display",
            "unit",
            "reorder_level",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class MedicineBatchSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source="medicine.name", read_only=True)

    class Meta:
        model = MedicineBatch
        fields = [
            "id",
            "medicine",
            "medicine_name",
            "batch_number",
            "supplier_name",
            "purchase_date",
            "expiry_date",
            "quantity",
            "purchase_price",
            "selling_price",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PharmacySaleItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source="medicine_batch.medicine.name", read_only=True)
    batch_number = serializers.CharField(source="medicine_batch.batch_number", read_only=True)

    class Meta:
        model = PharmacySaleItem
        fields = [
            "id",
            "sale",
            "medicine_batch",
            "medicine_name",
            "batch_number",
            "qty",
            "unit_price",
            "line_total",
            "created_at",
        ]
        read_only_fields = ["id", "sale", "medicine_batch", "unit_price", "line_total", "created_at"]


class PharmacySaleSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    sold_by_name = serializers.CharField(source="sold_by.full_name", read_only=True)
    items = PharmacySaleItemSerializer(many=True, read_only=True)

    class Meta:
        model = PharmacySale
        fields = [
            "id",
            "prescription",
            "patient",
            "patient_name",
            "patient_mrn",
            "sold_by",
            "sold_by_name",
            "invoice_number",
            "total_amount",
            "sold_at",
            "items",
            "created_at",
        ]
        read_only_fields = ["id", "invoice_number", "total_amount", "sold_at", "items", "created_at"]


class PrescriptionDispenseSerializer(serializers.Serializer):
    prescription_id = serializers.UUIDField()


class OtcSaleItemWriteSerializer(serializers.Serializer):
    medicine_id = serializers.UUIDField()
    qty = serializers.IntegerField(min_value=1)


class OtcSaleSerializer(serializers.Serializer):
    patient_id = serializers.UUIDField()
    items = OtcSaleItemWriteSerializer(many=True)
