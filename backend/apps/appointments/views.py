"""
MotherCare — Appointments Module Views
Architecture: CLAUDE.md — "Views: orchestration only"

ViewSets:
    AppointmentViewSet  — /api/v1/appointments/

Actions:
    list, retrieve, create
    confirm        — POST /api/v1/appointments/{id}/confirm/
    cancel         — POST /api/v1/appointments/{id}/cancel/
    start          — POST /api/v1/appointments/{id}/start/
    complete       — POST /api/v1/appointments/{id}/complete/
    no_show        — POST /api/v1/appointments/{id}/no-show/
    next_slot      — GET  /api/v1/appointments/next-slot/?doctor={id}&date=YYYY-MM-DD
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

from apps.appointments import services
from apps.appointments.models import Appointment
from apps.appointments.serializers import (
    AppointmentDetailSerializer,
    AppointmentListSerializer,
    AppointmentWriteSerializer,
)
from core.pagination import StandardResultsPagination
from core.permissions import IsAuthenticatedStaff

logger = logging.getLogger("mothercare")


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    CRUD + status actions for Appointment records.

    list:     GET  /api/v1/appointments/
    retrieve: GET  /api/v1/appointments/{id}/
    create:   POST /api/v1/appointments/
    update:   PATCH /api/v1/appointments/{id}/

    Soft delete (destroy) is NOT exposed — appointments use status cancellation.
    """

    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = [
        "status", "appointment_type", "doctor", "patient",
        "appointment_datetime",
    ]
    search_fields = ["patient__full_name", "patient__mrn", "doctor__staff__full_name"]
    ordering_fields = ["appointment_datetime", "token_number", "created_at", "status"]
    ordering = ["appointment_datetime"]

    # Disable destroy — appointments are cancelled via action, never hard/soft deleted via API
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self) -> QuerySet:
        return Appointment.objects.select_related(
            "patient",
            "doctor",
            "doctor__staff",
            "booked_by",
        ).all()

    def get_serializer_class(self) -> type[serializers.Serializer]:
        if self.action == "list":
            return AppointmentListSerializer
        if self.action in ("create", "partial_update"):
            return AppointmentWriteSerializer
        return AppointmentDetailSerializer

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = AppointmentWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        try:
            appointment = services.book_appointment(
                validated_data=serializer.validated_data,
                booked_by=request.user,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        out = AppointmentDetailSerializer(appointment, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        appointment = self.get_object()
        if appointment.status in ("completed", "cancelled", "no_show"):
            return Response(
                {"detail": f"Cannot edit a {appointment.status} appointment."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = AppointmentWriteSerializer(
            appointment, data=request.data, partial=True, context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        for field, value in serializer.validated_data.items():
            setattr(appointment, field, value)
        appointment.save()

        out = AppointmentDetailSerializer(appointment, context={"request": request})
        return Response(out.data)

    # ── Status Actions ────────────────────────────────────────────────────────

    @action(detail=True, methods=["post"])
    def confirm(self, request: Request, pk: str | None = None) -> Response:
        """POST /api/v1/appointments/{id}/confirm/ — scheduled → confirmed"""
        appointment = self.get_object()
        try:
            appointment = services.confirm_appointment(appointment, user=request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(AppointmentDetailSerializer(appointment).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request: Request, pk: str | None = None) -> Response:
        """POST /api/v1/appointments/{id}/cancel/ — → cancelled"""
        appointment = self.get_object()
        reason = request.data.get("reason", "")
        try:
            appointment = services.cancel_appointment(appointment, user=request.user, reason=reason)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(AppointmentDetailSerializer(appointment).data)

    @action(detail=True, methods=["post"])
    def start(self, request: Request, pk: str | None = None) -> Response:
        """POST /api/v1/appointments/{id}/start/ — confirmed → in_progress"""
        appointment = self.get_object()
        try:
            appointment = services.start_appointment(appointment, user=request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(AppointmentDetailSerializer(appointment).data)

    @action(detail=True, methods=["post"])
    def complete(self, request: Request, pk: str | None = None) -> Response:
        """POST /api/v1/appointments/{id}/complete/ — in_progress → completed"""
        appointment = self.get_object()
        try:
            appointment = services.complete_appointment(appointment, user=request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(AppointmentDetailSerializer(appointment).data)

    @action(detail=True, methods=["post"], url_path="no-show")
    def no_show(self, request: Request, pk: str | None = None) -> Response:
        """POST /api/v1/appointments/{id}/no-show/ — → no_show"""
        appointment = self.get_object()
        try:
            appointment = services.mark_no_show(appointment, user=request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(AppointmentDetailSerializer(appointment).data)

    @action(detail=False, methods=["get"], url_path="next-slot")
    def next_slot(self, request: Request) -> Response:
        """
        GET /api/v1/appointments/next-slot/?doctor={id}&date=YYYY-MM-DD
        Returns next available datetime slot for a doctor on a given date.
        """
        from datetime import date as date_type

        from apps.people.models import Doctor

        doctor_id = request.query_params.get("doctor")
        date_str = request.query_params.get("date")

        if not doctor_id or not date_str:
            return Response(
                {"detail": "Both 'doctor' and 'date' query parameters are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            doctor = Doctor.objects.get(id=doctor_id)
            appt_date = date_type.fromisoformat(date_str)
        except (Doctor.DoesNotExist, ValueError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        next_slot = services.get_next_available_slot(doctor, appt_date)
        return Response({
            "doctor": str(doctor_id),
            "date": date_str,
            "next_available_slot": next_slot.isoformat() if next_slot else None,
            "available": next_slot is not None,
        })

    @action(detail=False, methods=["get"], url_path="today")
    def today(self, request: Request) -> Response:
        """GET /api/v1/appointments/today/ — appointments for today, sorted by token"""
        from django.utils.timezone import now
        today = now().date()
        qs = self.get_queryset().filter(
            appointment_datetime__date=today,
            is_deleted=False,
        ).order_by("token_number")
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(AppointmentListSerializer(page, many=True).data)
        return Response(AppointmentListSerializer(qs, many=True).data)
