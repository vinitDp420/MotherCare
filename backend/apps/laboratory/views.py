"""
MotherCare — Laboratory Module Views
Architecture: CLAUDE.md — "Views: orchestration only"

ViewSet:
    LabTestViewSet  — /api/v1/laboratory/lab-tests/

Actions:
    list, retrieve, create
    partial_update  — status update only
    upload_report   — POST /api/v1/laboratory/lab-tests/{id}/upload-report/
    flag            — POST /api/v1/laboratory/lab-tests/{id}/flag/
    queue           — GET  /api/v1/laboratory/lab-tests/queue/
    flagged         — GET  /api/v1/laboratory/lab-tests/flagged/
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

from apps.laboratory import services
from apps.laboratory.models import LabTest
from apps.laboratory.serializers import (
    FlagSerializer,
    LabReportFileSerializer,
    LabReportFileUploadSerializer,
    LabTestDetailSerializer,
    LabTestListSerializer,
    LabTestWriteSerializer,
    StatusUpdateSerializer,
)
from core.pagination import StandardResultsPagination
from core.permissions import IsAuthenticatedStaff

logger = logging.getLogger("mothercare")


class LabTestViewSet(viewsets.ModelViewSet):
    """
    CRUD + action endpoints for LabTest records.

    list:           GET  /api/v1/laboratory/lab-tests/
    retrieve:       GET  /api/v1/laboratory/lab-tests/{id}/
    create:         POST /api/v1/laboratory/lab-tests/
    partial_update: PATCH /api/v1/laboratory/lab-tests/{id}/  (status update)
    upload_report:  POST /api/v1/laboratory/lab-tests/{id}/upload-report/
    flag:           POST /api/v1/laboratory/lab-tests/{id}/flag/
    queue:          GET  /api/v1/laboratory/lab-tests/queue/
    flagged:        GET  /api/v1/laboratory/lab-tests/flagged/
    """

    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["status", "urgency", "patient", "ordered_by", "flagged", "consultation"]
    search_fields = ["patient__full_name", "patient__mrn", "test_type"]
    ordering_fields = ["requested_at", "urgency", "status", "flagged"]
    ordering = ["urgency", "-requested_at"]

    # No DELETE — lab records are permanent
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self) -> QuerySet:
        return (
            LabTest.objects.select_related(
                "patient",
                "ordered_by",
                "ordered_by__staff",
                "consultation",
            )
            .prefetch_related("report_files")
            .all()
        )

    def get_serializer_class(self) -> type[serializers.Serializer]:
        if self.action == "list":
            return LabTestListSerializer
        if self.action == "create":
            return LabTestWriteSerializer
        if self.action == "partial_update":
            return StatusUpdateSerializer
        if self.action == "upload_report":
            return LabReportFileUploadSerializer
        if self.action == "flag":
            return FlagSerializer
        return LabTestDetailSerializer

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """POST /api/v1/laboratory/lab-tests/ — Order a new lab test."""
        serializer = LabTestWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        try:
            lab_test = services.order_lab_test(
                validated_data=dict(serializer.validated_data),
                created_by=request.user,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        out = LabTestDetailSerializer(lab_test, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """PATCH /api/v1/laboratory/lab-tests/{id}/ — Update status only."""
        lab_test = self.get_object()
        serializer = StatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            lab_test = services.update_lab_status(
                lab_test=lab_test,
                new_status=serializer.validated_data["new_status"],
                key_findings=serializer.validated_data.get("key_findings", ""),
                updated_by=request.user,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        out = LabTestDetailSerializer(lab_test, context={"request": request})
        return Response(out.data)

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """DELETE is forbidden — lab records are permanent."""
        return Response(
            {"detail": "Lab test records cannot be deleted."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    # ── Custom Actions ────────────────────────────────────────────────────────

    @action(detail=True, methods=["post"], url_path="upload-report")
    def upload_report(self, request: Request, pk: str | None = None) -> Response:
        """
        POST /api/v1/laboratory/lab-tests/{id}/upload-report/
        Append a new report file to a lab test (BR-LAB-01: append-only).
        """
        lab_test = self.get_object()
        serializer = LabReportFileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            report_file = services.upload_lab_report(
                lab_test=lab_test,
                file_url=serializer.validated_data["file_url"],
                file_type=serializer.validated_data["file_type"],
                notes=serializer.validated_data.get("notes", ""),
                uploaded_by=request.user,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            LabReportFileSerializer(report_file, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def flag(self, request: Request, pk: str | None = None) -> Response:
        """
        POST /api/v1/laboratory/lab-tests/{id}/flag/
        Manually flag a lab test as requiring clinical attention.
        """
        lab_test = self.get_object()
        serializer = FlagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lab_test = services.flag_lab_test(lab_test, updated_by=request.user)
        return Response(LabTestDetailSerializer(lab_test, context={"request": request}).data)

    @action(detail=False, methods=["get"])
    def queue(self, request: Request) -> Response:
        """
        GET /api/v1/laboratory/lab-tests/queue/
        Lab work queue ordered STAT → Urgent → Routine.
        Query params:
            ?urgency=stat|urgent|routine  (optional filter)
            ?status=pending|in_progress   (default: pending)
        """
        urgency_filter = request.query_params.get("urgency")
        status_filter = request.query_params.get("status", "pending")

        qs = services.get_lab_queue(
            urgency_filter=urgency_filter,
            status_filter=status_filter,
        )
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(
                LabTestListSerializer(page, many=True, context={"request": request}).data
            )
        return Response(LabTestListSerializer(qs, many=True, context={"request": request}).data)

    @action(detail=False, methods=["get"])
    def flagged(self, request: Request) -> Response:
        """
        GET /api/v1/laboratory/lab-tests/flagged/
        Flagged results requiring clinical follow-up (BR-LAB-02).
        """
        limit = int(request.query_params.get("limit", 50))
        qs = services.get_flagged_results(limit=limit)
        return Response(
            LabTestListSerializer(qs, many=True, context={"request": request}).data
        )
