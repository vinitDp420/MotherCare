"""
MotherCare — Billing Module Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from core.permissions import IsAuthenticatedStaff
from core.pagination import StandardResultsPagination
from apps.billing.models import Bill, BillPayment
from apps.billing.serializers import (
    BillListSerializer,
    BillDetailSerializer,
    BillWriteSerializer,
    BillPaymentSerializer,
    PaymentRecordSerializer,
)
from apps.billing import services

class BillViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    queryset = Bill.objects.select_related("patient", "admission").prefetch_related("items", "payments").all()
    filterset_fields = ["patient", "admission", "bill_type", "payment_status"]
    search_fields = ["invoice_number", "patient__full_name", "patient__mrn"]
    ordering_fields = ["generated_at", "total_amount", "amount_paid"]
    ordering = ["-generated_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return BillListSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return BillWriteSerializer
        return BillDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        patient = serializer.validated_data["patient"]
        bill_type = serializer.validated_data["bill_type"]
        admission = serializer.validated_data.get("admission")
        notes = serializer.validated_data.get("notes", "")
        items_data = serializer.validated_data.get("items", [])

        try:
            bill = services.create_bill(
                patient=patient,
                bill_type=bill_type,
                admission=admission,
                items_data=items_data,
                notes=notes,
                created_by=request.user
            )
            detail_serializer = BillDetailSerializer(bill)
            return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="record-payment")
    def record_payment(self, request, pk=None):
        bill = self.get_object()
        serializer = PaymentRecordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data["amount"]
        payment_method = serializer.validated_data["payment_method"]
        transaction_ref = serializer.validated_data.get("transaction_ref", "")

        try:
            payment = services.record_payment(
                bill=bill,
                amount=amount,
                payment_method=payment_method,
                transaction_ref=transaction_ref,
                recorded_by=request.user
            )
            payment_serializer = BillPaymentSerializer(payment)
            return Response(payment_serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BillPaymentViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    queryset = BillPayment.objects.select_related("bill", "recorded_by").all()
    serializer_class = BillPaymentSerializer
    filterset_fields = ["bill", "payment_method", "recorded_by"]
    ordering = ["-paid_at"]
