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

from django.db import transaction
from django.db.models import QuerySet
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.laboratory import services
from apps.laboratory.models import LabTest, TestMaster, LabOrder, LabOrderItem, LabReport
from apps.laboratory.serializers import (
    FlagSerializer,
    LabReportFileSerializer,
    LabReportFileUploadSerializer,
    LabTestDetailSerializer,
    LabTestListSerializer,
    LabTestWriteSerializer,
    StatusUpdateSerializer,
    TestMasterSerializer,
    LabOrderSerializer,
    LabOrderWriteSerializer,
    LabReportSerializer,
    LabReportUploadInputSerializer,
    LabOrderReviewSerializer,
)
from core.pagination import StandardResultsPagination
from core.permissions import IsAuthenticatedStaff, IsDoctor

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
        Renames the file to UUID and saves under /media/lab_reports/.
        """
        lab_test = self.get_object()
        serializer = LabReportFileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file_obj = serializer.validated_data["file"]
        import os
        import uuid
        from django.conf import settings

        ext = os.path.splitext(file_obj.name)[1].lower()
        file_type = ext.replace(".", "")
        if file_type == "jpeg":
            file_type = "jpg"

        if file_type not in {"pdf", "jpg", "png", "dicom"}:
            return Response(
                {"detail": f"File type '{file_type}' is not supported. Supported: pdf, jpg, png, dicom."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        uuid_filename = f"{uuid.uuid4()}{ext}"
        save_dir = os.path.join(settings.MEDIA_ROOT, "lab_reports")
        os.makedirs(save_dir, exist_ok=True)
        save_path = os.path.join(save_dir, uuid_filename)

        try:
            with open(save_path, "wb+") as destination:
                for chunk in file_obj.chunks():
                    destination.write(chunk)
        except Exception as e:
            return Response(
                {"detail": f"Failed to save file: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        file_url = request.build_absolute_uri(f"{settings.MEDIA_URL}lab_reports/{uuid_filename}")

        try:
            report_file = services.upload_lab_report(
                lab_test=lab_test,
                file_url=file_url,
                file_type=file_type,
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


class TestMasterViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly endpoint for TestMaster catalog.
    """
    queryset = TestMaster.objects.filter(is_active=True)
    serializer_class = TestMasterSerializer
    permission_classes = [IsAuthenticatedStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category"]
    search_fields = ["name", "code", "category"]
    ordering_fields = ["name", "category", "price"]
    ordering = ["name"]


class LabOrderViewSet(viewsets.ModelViewSet):
    """
    CRUD + custom actions for LabOrder.
    """
    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["status", "patient", "doctor", "consultation"]
    search_fields = ["patient__full_name", "patient__mrn", "clinical_note"]
    ordering_fields = ["ordered_at", "status"]
    ordering = ["-ordered_at"]

    # No DELETE
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self) -> QuerySet:
        return (
            LabOrder.objects.select_related("patient", "doctor", "doctor__staff", "consultation")
            .prefetch_related("items", "items__test", "reports", "reports__uploaded_by")
            .all()
        )

    def get_serializer_class(self) -> type[serializers.Serializer]:
        if self.action == "create":
            return LabOrderWriteSerializer
        return LabOrderSerializer

    @transaction.atomic
    def perform_create(self, serializer: serializers.ModelSerializer) -> None:
        tests = serializer.validated_data.pop("tests")
        lab_order = serializer.save(created_by=self.request.user)
        for test in tests:
            LabOrderItem.objects.create(
                lab_order=lab_order,
                test=test,
                created_by=self.request.user
            )
        _write_audit(
            action_type="create",
            entity_name="LabOrder",
            entity_id=str(lab_order.id),
            user=self.request.user,
            new_value={
                "patient_id": str(lab_order.patient_id),
                "doctor_id": str(lab_order.doctor_id),
                "test_count": len(tests)
            }
        )

    @action(detail=True, methods=["get", "post"], url_path="report")
    def report(self, request: Request, pk: str | None = None) -> Response:
        """
        GET: retrieve reports for this order.
        POST: upload a new report PDF.
        """
        lab_order = self.get_object()
        if request.method == "GET":
            reports = lab_order.reports.all()
            return Response(LabReportSerializer(reports, many=True, context={"request": request}).data)

        serializer = LabReportUploadInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file_obj = serializer.validated_data["file"]

        lab_report = LabReport.objects.create(
            lab_order=lab_order,
            report_file=file_obj,
            uploaded_by=request.user,
            created_by=request.user
        )

        _write_audit(
            action_type="create",
            entity_name="LabReport",
            entity_id=str(lab_report.id),
            user=request.user,
            new_value={
                "lab_order_id": str(lab_order.id),
                "file_name": file_obj.name
            }
        )

        return Response(
            LabReportSerializer(lab_report, context={"request": request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["patch"], url_path="review")
    def review(self, request: Request, pk: str | None = None) -> Response:
        """
        PATCH: review a report and add comments.
        Accepts: {"doctor_comment": "...", "report_id": 123} (report_id is optional)
        """
        lab_order = self.get_object()
        serializer = LabOrderReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        report_id = request.data.get("report_id")
        if report_id:
            try:
                report = lab_order.reports.get(id=report_id)
            except LabReport.DoesNotExist:
                return Response(
                    {"detail": f"Lab report with ID {report_id} does not exist for this order."},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            report = lab_order.reports.order_by("-uploaded_at").first()
            if not report:
                return Response(
                    {"detail": "No report uploaded yet for this lab order to review."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        report.doctor_comment = serializer.validated_data["doctor_comment"]
        report.reviewed_at = timezone.now()
        report.updated_by = request.user
        report.save(update_fields=["doctor_comment", "reviewed_at", "updated_by", "updated_at"])

        _write_audit(
            action_type="update",
            entity_name="LabReport",
            entity_id=str(report.id),
            user=request.user,
            new_value={
                "doctor_comment": report.doctor_comment,
                "reviewed_at": str(report.reviewed_at)
            }
        )

        return Response(LabReportSerializer(report, context={"request": request}).data)


def _write_audit(
    action_type: str,
    entity_name: str,
    entity_id: str,
    user: object,
    old_value: dict | None = None,
    new_value: dict | None = None,
) -> None:
    """Write AuditLog. Failures never re-raise."""
    try:
        from apps.audit.utils import log_event
        log_event(
            action_type=action_type,
            entity_name=entity_name,
            entity_id=entity_id,
            user=user,
            old_value=old_value or {},
            new_value=new_value or {},
        )
    except Exception:  # noqa: BLE001
        logger.exception("AuditLog write failed for %s %s", entity_name, entity_id)

