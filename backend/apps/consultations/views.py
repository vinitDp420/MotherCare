"""
MotherCare — Consultations Module Views
Architecture: CLAUDE.md — "Views: orchestration only"

ViewSets:
    ConsultationViewSet  — /api/v1/consultations/

Actions:
    list, retrieve, create (from appointment)
    partial_update (clinical notes only — in_progress only)
    complete    — POST /api/v1/consultations/{id}/complete/
    cancel      — POST /api/v1/consultations/{id}/cancel/
    follow_up   — POST /api/v1/consultations/{id}/follow-up/
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

from apps.consultations import services
from apps.consultations.models import Consultation
from apps.consultations.serializers import (
    CompleteConsultationSerializer,
    ConsultationDetailSerializer,
    ConsultationListSerializer,
    ConsultationUpdateSerializer,
    ConsultationWriteSerializer,
    FollowUpSerializer,
)
from core.pagination import StandardResultsPagination
from core.permissions import IsAuthenticatedStaff

logger = logging.getLogger("mothercare")


class ConsultationViewSet(viewsets.ModelViewSet):
    """
    CRUD + action endpoints for Consultation records.

    list:           GET  /api/v1/consultations/
    retrieve:       GET  /api/v1/consultations/{id}/
    create:         POST /api/v1/consultations/
    partial_update: PATCH /api/v1/consultations/{id}/  (in_progress only)
    complete:       POST /api/v1/consultations/{id}/complete/
    cancel:         POST /api/v1/consultations/{id}/cancel/
    follow_up:      POST /api/v1/consultations/{id}/follow-up/
    """

    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["status", "doctor", "patient", "appointment"]
    search_fields = ["patient__full_name", "patient__mrn", "doctor__staff__full_name"]
    ordering_fields = ["start_time", "end_time", "created_at", "status"]
    ordering = ["-start_time"]

    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self) -> QuerySet:
        return Consultation.objects.select_related(
            "appointment",
            "patient",
            "doctor",
            "doctor__staff",
        ).all()

    def get_serializer_class(self) -> type[serializers.Serializer]:
        if self.action == "list":
            return ConsultationListSerializer
        if self.action == "create":
            return ConsultationWriteSerializer
        if self.action == "partial_update":
            return ConsultationUpdateSerializer
        if self.action == "complete":
            return CompleteConsultationSerializer
        if self.action == "follow_up":
            return FollowUpSerializer
        return ConsultationDetailSerializer

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = ConsultationWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        try:
            consultation = services.create_consultation(
                appointment=serializer.validated_data["appointment"],
                created_by=request.user,
                clinical_notes=serializer.validated_data.get("clinical_notes", ""),
                diagnosis=serializer.validated_data.get("diagnosis", ""),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        out = ConsultationDetailSerializer(consultation, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        consultation = self.get_object()
        serializer = ConsultationUpdateSerializer(
            consultation, data=request.data, partial=True, context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        try:
            consultation = services.update_clinical_notes(
                consultation=consultation,
                clinical_notes=serializer.validated_data.get("clinical_notes", consultation.clinical_notes),
                diagnosis=serializer.validated_data.get("diagnosis", consultation.diagnosis),
                updated_by=request.user,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        out = ConsultationDetailSerializer(consultation, context={"request": request})
        return Response(out.data)

    # ── Status Actions ────────────────────────────────────────────────────────

    @action(detail=True, methods=["post"])
    def complete(self, request: Request, pk: str | None = None) -> Response:
        """
        POST /api/v1/consultations/{id}/complete/
        Complete a consultation — also auto-completes the parent appointment.
        """
        consultation = self.get_object()
        serializer = CompleteConsultationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            consultation = services.complete_consultation(
                consultation=consultation,
                clinical_notes=serializer.validated_data.get("clinical_notes"),
                diagnosis=serializer.validated_data.get("diagnosis"),
                updated_by=request.user,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        out = ConsultationDetailSerializer(consultation, context={"request": request})
        return Response(out.data)

    @action(detail=True, methods=["post"])
    def cancel(self, request: Request, pk: str | None = None) -> Response:
        """POST /api/v1/consultations/{id}/cancel/ — cancel an in_progress consultation"""
        consultation = self.get_object()
        reason = request.data.get("reason", "")
        try:
            consultation = services.cancel_consultation(
                consultation=consultation,
                user=request.user,
                reason=reason,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ConsultationDetailSerializer(consultation).data)

    @action(detail=True, methods=["post"], url_path="follow-up")
    def follow_up(self, request: Request, pk: str | None = None) -> Response:
        """
        POST /api/v1/consultations/{id}/follow-up/
        Schedule a follow-up appointment from within this consultation.
        """
        consultation = self.get_object()
        serializer = FollowUpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            follow_up_appt = services.schedule_follow_up(
                consultation=consultation,
                follow_up_datetime=serializer.validated_data["follow_up_datetime"],
                notes=serializer.validated_data.get("notes", ""),
                created_by=request.user,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        from apps.appointments.serializers import AppointmentDetailSerializer
        return Response(
            AppointmentDetailSerializer(follow_up_appt, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )
