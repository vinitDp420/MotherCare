"""
MotherCare — Prescriptions Module Views
Architecture: CLAUDE.md — "Views: orchestration only"

ViewSet:
    PrescriptionViewSet  — /api/v1/prescriptions/

Immutability: No PUT, PATCH, or DELETE.
Only GET and POST are allowed (BR-RX-01).
"""
from __future__ import annotations

import logging
from typing import Any

from django.db.models import QuerySet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.prescriptions import services
from apps.prescriptions.models import Prescription
from apps.prescriptions.serializers import (
    PrescriptionDetailSerializer,
    PrescriptionItemSerializer,
    PrescriptionListSerializer,
    PrescriptionWriteSerializer,
)
from core.pagination import StandardResultsPagination
from core.permissions import IsAuthenticatedStaff

logger = logging.getLogger("mothercare")


class PrescriptionViewSet(viewsets.ModelViewSet):
    """
    Prescription CRUD — create and read only (BR-RX-01: immutable).

    list:     GET  /api/v1/prescriptions/
    retrieve: GET  /api/v1/prescriptions/{id}/
    create:   POST /api/v1/prescriptions/

    Actions:
        items       GET  /api/v1/prescriptions/{id}/items/
        history     GET  /api/v1/prescriptions/history/?patient=<uuid>
        duplicate   POST /api/v1/prescriptions/{id}/duplicate/
    """

    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["patient", "consultation"]
    search_fields = ["patient__full_name", "patient__mrn"]
    ordering_fields = ["issued_at", "created_at"]
    ordering = ["-issued_at"]

    # BR-RX-01: Prescriptions are immutable — no PUT, PATCH, or DELETE
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self) -> QuerySet:
        return (
            Prescription.objects.select_related("consultation", "patient")
            .prefetch_related("items", "items__medicine")
            .all()
        )

    def get_serializer_class(self) -> type[serializers.Serializer]:
        if self.action == "list":
            return PrescriptionListSerializer
        if self.action == "create":
            return PrescriptionWriteSerializer
        return PrescriptionDetailSerializer

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """POST /api/v1/prescriptions/ — Create prescription with items atomically."""
        serializer = PrescriptionWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        # Extract nested items before passing to service
        items_data = serializer.validated_data.pop("items", [])

        try:
            prescription = services.create_full_prescription(
                consultation=serializer.validated_data["consultation"],
                patient=serializer.validated_data["patient"],
                notes=serializer.validated_data.get("notes", ""),
                items_data=[
                    {
                        "medicine": item["medicine"],
                        "dosage": item["dosage"],
                        "frequency": item["frequency"],
                        "duration": item["duration"],
                        "instructions": item.get("instructions", ""),
                        "sort_order": item.get("sort_order", 0),
                    }
                    for item in items_data
                ],
                created_by=request.user,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        out = PrescriptionDetailSerializer(prescription, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """DELETE is forbidden on prescriptions (BR-RX-01)."""
        return Response(
            {"detail": "Prescriptions are immutable and cannot be deleted. [BR-RX-01]"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    # ── Sub-resource actions ──────────────────────────────────────────────────

    @action(detail=True, methods=["get"], url_path="items")
    def items_list(self, request: Request, pk: str | None = None) -> Response:
        """GET /api/v1/prescriptions/{id}/items/ — List all items in a prescription."""
        prescription = self.get_object()
        items = prescription.items.select_related("medicine").order_by("sort_order")
        page = self.paginate_queryset(items)
        if page is not None:
            return self.get_paginated_response(PrescriptionItemSerializer(page, many=True).data)
        return Response(PrescriptionItemSerializer(items, many=True).data)

    @action(detail=False, methods=["get"], url_path="history")
    def patient_history(self, request: Request) -> Response:
        """
        GET /api/v1/prescriptions/history/?patient=<uuid>
        Returns prescription history for a patient (for re-prescribe workflow).
        """
        from apps.people.models import Patient

        patient_id = request.query_params.get("patient")
        if not patient_id:
            return Response(
                {"detail": "'patient' query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response({"detail": "Patient not found."}, status=status.HTTP_404_NOT_FOUND)

        limit = int(request.query_params.get("limit", 10))
        prescriptions = services.get_patient_prescription_history(patient, limit=limit)
        return Response(PrescriptionDetailSerializer(prescriptions, many=True).data)

    @action(detail=True, methods=["post"], url_path="duplicate")
    def duplicate(self, request: Request, pk: str | None = None) -> Response:
        """
        POST /api/v1/prescriptions/{id}/duplicate/
        Body: { "consultation": "<uuid>", "patient": "<uuid>" }
        Creates a new prescription copying all items from the source.
        """
        from apps.consultations.models import Consultation
        from apps.people.models import Patient

        source_prescription = self.get_object()

        consultation_id = request.data.get("consultation")
        patient_id = request.data.get("patient")

        if not consultation_id or not patient_id:
            return Response(
                {"detail": "Both 'consultation' and 'patient' are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            consultation = Consultation.objects.get(id=consultation_id)
            patient = Patient.objects.get(id=patient_id)
        except (Consultation.DoesNotExist, Patient.DoesNotExist) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)

        try:
            new_prescription = services.duplicate_previous_prescription(
                source_prescription=source_prescription,
                consultation=consultation,
                patient=patient,
                created_by=request.user,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        out = PrescriptionDetailSerializer(new_prescription, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)
