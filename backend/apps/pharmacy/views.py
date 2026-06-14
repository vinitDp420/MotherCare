"""
MotherCare — Pharmacy Module Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from core.permissions import IsAuthenticatedStaff
from core.pagination import StandardResultsPagination
from apps.pharmacy.models import Medicine, MedicineBatch, PharmacySale
from apps.prescriptions.models import Prescription
from apps.people.models import Patient
from apps.pharmacy.serializers import (
    MedicineSerializer,
    MedicineBatchSerializer,
    PharmacySaleSerializer,
    PrescriptionDispenseSerializer,
    OtcSaleSerializer,
)
from apps.pharmacy import services

class MedicineViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    filterset_fields = ["is_active", "category"]
    search_fields = ["name", "generic_name"]
    ordering_fields = ["name", "category", "created_at"]
    ordering = ["name"]


class MedicineBatchViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    queryset = MedicineBatch.objects.select_related("medicine").all()
    serializer_class = MedicineBatchSerializer
    filterset_fields = ["medicine", "expiry_date"]
    search_fields = ["batch_number", "supplier_name", "medicine__name"]
    ordering_fields = ["expiry_date", "purchase_date", "quantity"]
    ordering = ["expiry_date", "purchase_date"]


class PharmacySaleViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    queryset = PharmacySale.objects.select_related("prescription", "patient", "sold_by").prefetch_related("items", "items__medicine_batch", "items__medicine_batch__medicine").all()
    serializer_class = PharmacySaleSerializer
    filterset_fields = ["patient", "prescription", "invoice_number"]
    search_fields = ["invoice_number", "patient__full_name", "patient__mrn"]
    ordering = ["-sold_at"]

    @action(detail=False, methods=["post"], url_path="dispense")
    def dispense(self, request):
        serializer = PrescriptionDispenseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        prescription_id = serializer.validated_data["prescription_id"]
        prescription = get_object_or_404(Prescription, id=prescription_id)

        try:
            sale = services.dispense_prescription(prescription, sold_by=request.user)
            return Response(self.get_serializer(sale).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"], url_path="otc-sale")
    def otc_sale(self, request):
        serializer = OtcSaleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        patient_id = serializer.validated_data["patient_id"]
        patient = get_object_or_404(Patient, id=patient_id)
        
        items_data_input = serializer.validated_data["items"]
        items_data = []
        for item in items_data_input:
            medicine = get_object_or_404(Medicine, id=item["medicine_id"])
            items_data.append({
                "medicine": medicine,
                "qty": item["qty"]
            })

        try:
            sale = services.process_otc_sale(patient, items_data, sold_by=request.user)
            return Response(self.get_serializer(sale).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
