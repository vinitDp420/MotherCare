"""
MotherCare — Pregnancy Module Views
Architecture: CLAUDE.md — "Views: orchestration only — call serializer → service → return response"

ViewSets:
    PregnancyViewSet    — /api/v1/pregnancies/
    Sub-resources (actions on PregnancyViewSet):
        anc_visits      — /api/v1/pregnancies/{id}/anc-visits/
        risk_events     — /api/v1/pregnancies/{id}/risk-events/
        vaccinations    — /api/v1/pregnancies/{id}/vaccinations/
        wellness_plan   — /api/v1/pregnancies/{id}/wellness-plan/
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

from apps.pregnancy import services
from apps.pregnancy.models import (
    AncVisit,
    Pregnancy,
    Vaccination,
)
from apps.pregnancy.serializers import (
    AncVisitSerializer,
    AncVisitWriteSerializer,
    PregnancyDetailSerializer,
    PregnancyListSerializer,
    PregnancyWriteSerializer,
    RiskEventSerializer,
    RiskEventWriteSerializer,
    VaccinationSerializer,
    VaccinationWriteSerializer,
    WellnessPlanSerializer,
    WellnessPlanWriteSerializer,
)
from core.pagination import StandardResultsPagination
from core.permissions import IsAuthenticatedStaff

logger = logging.getLogger("mothercare")


class PregnancyViewSet(viewsets.ModelViewSet):
    """
    CRUD for Pregnancy records.

    list:           GET  /api/v1/pregnancies/
    retrieve:       GET  /api/v1/pregnancies/{id}/
    create:         POST /api/v1/pregnancies/
    update:         PUT  /api/v1/pregnancies/{id}/
    partial_update: PATCH /api/v1/pregnancies/{id}/
    destroy:        DELETE /api/v1/pregnancies/{id}/  → soft delete only (BR-SD-01)

    Sub-resources:
        anc_visits:     GET/POST  /api/v1/pregnancies/{id}/anc-visits/
        anc_visit_detail: PATCH/DELETE /api/v1/pregnancies/{id}/anc-visits/{visit_id}/
        risk_events:    GET/POST  /api/v1/pregnancies/{id}/risk-events/
        vaccinations:   GET/POST  /api/v1/pregnancies/{id}/vaccinations/
        vaccination_detail: PATCH /api/v1/pregnancies/{id}/vaccinations/{vacc_id}/
        wellness_plan:  GET/PUT/PATCH /api/v1/pregnancies/{id}/wellness-plan/
    """

    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["risk_status", "is_active", "trimester", "patient", "assigned_doctor"]
    search_fields = ["patient__full_name", "patient__mrn"]
    ordering_fields = ["created_at", "lmp", "edd", "current_week", "risk_status"]
    ordering = ["-created_at"]

    def get_queryset(self) -> QuerySet:
        return Pregnancy.objects.select_related(
            "patient",
            "assigned_doctor",
            "assigned_doctor__staff",
        ).all()

    def get_serializer_class(self) -> type[serializers.Serializer]:
        if self.action == "list":
            return PregnancyListSerializer
        if self.action in ("create", "update", "partial_update"):
            return PregnancyWriteSerializer
        return PregnancyDetailSerializer

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = PregnancyWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        try:
            pregnancy = services.create_pregnancy(
                validated_data=serializer.validated_data,
                created_by=request.user,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # Auto-initialize standard maternal vaccinations
        try:
            services.initialize_standard_vaccinations(pregnancy, created_by=request.user)
        except Exception:  # noqa: BLE001
            logger.exception("Failed to initialize standard vaccinations for pregnancy %s", pregnancy.id)

        out = PregnancyDetailSerializer(pregnancy, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    def update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        partial = kwargs.pop("partial", False)
        pregnancy = self.get_object()
        serializer = PregnancyWriteSerializer(
            pregnancy, data=request.data, partial=partial,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        try:
            pregnancy = services.update_pregnancy(
                pregnancy=pregnancy,
                validated_data=serializer.validated_data,
                updated_by=request.user,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        out = PregnancyDetailSerializer(pregnancy, context={"request": request})
        return Response(out.data)

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Soft-delete only — BR-SD-01."""
        pregnancy = self.get_object()
        try:
            services.soft_delete_pregnancy(pregnancy=pregnancy, deleted_by=request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {"detail": f"Pregnancy {pregnancy.id} soft-deleted."},
            status=status.HTTP_200_OK,
        )

    # ── ANC Visits sub-resource ───────────────────────────────────────────────
    @action(detail=True, methods=["get", "post"], url_path="anc-visits")
    def anc_visits(self, request: Request, pk: str | None = None) -> Response:
        """
        GET  /api/v1/pregnancies/{id}/anc-visits/ — list all ANC visits
        POST /api/v1/pregnancies/{id}/anc-visits/ — record a new ANC visit
        """
        pregnancy = self.get_object()

        if request.method == "GET":
            visits = pregnancy.anc_visits.select_related("doctor", "doctor__staff").order_by("-visit_date")
            page = self.paginate_queryset(visits)
            if page is not None:
                return self.get_paginated_response(AncVisitSerializer(page, many=True).data)
            return Response(AncVisitSerializer(visits, many=True).data)

        # POST
        serializer = AncVisitWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        visit = services.record_anc_visit(
            pregnancy=pregnancy,
            validated_data=serializer.validated_data,
            created_by=request.user,
        )
        return Response(AncVisitSerializer(visit).data, status=status.HTTP_201_CREATED)

    @action(
        detail=True, methods=["patch", "delete"],
        url_path=r"anc-visits/(?P<visit_id>[0-9a-f-]+)",
    )
    def anc_visit_detail(
        self, request: Request, pk: str | None = None, visit_id: str | None = None,
    ) -> Response:
        """
        PATCH  /api/v1/pregnancies/{id}/anc-visits/{visit_id}/ — update ANC visit
        DELETE /api/v1/pregnancies/{id}/anc-visits/{visit_id}/ — delete ANC visit
        """
        pregnancy = self.get_object()
        visit = AncVisit.objects.filter(id=visit_id, pregnancy=pregnancy).first()
        if not visit:
            return Response({"detail": "ANC visit not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.method == "DELETE":
            visit.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        serializer = AncVisitWriteSerializer(visit, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        visit = services.update_anc_visit(
            visit=visit,
            validated_data=serializer.validated_data,
            updated_by=request.user,
        )
        return Response(AncVisitSerializer(visit).data)

    # ── Risk Events sub-resource ──────────────────────────────────────────────
    @action(detail=True, methods=["get", "post"], url_path="risk-events")
    def risk_events(self, request: Request, pk: str | None = None) -> Response:
        """
        GET  /api/v1/pregnancies/{id}/risk-events/ — list risk events (risk timeline)
        POST /api/v1/pregnancies/{id}/risk-events/ — record a new risk event
        """
        pregnancy = self.get_object()

        if request.method == "GET":
            events = pregnancy.risk_events.order_by("-event_date", "-week_number")
            return Response(RiskEventSerializer(events, many=True).data)

        serializer = RiskEventWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = services.record_risk_event(
            pregnancy=pregnancy,
            validated_data=serializer.validated_data,
            created_by=request.user,
        )
        return Response(RiskEventSerializer(event).data, status=status.HTTP_201_CREATED)

    # ── Vaccinations sub-resource ─────────────────────────────────────────────
    @action(detail=True, methods=["get", "post"], url_path="vaccinations")
    def vaccinations(self, request: Request, pk: str | None = None) -> Response:
        """
        GET  /api/v1/pregnancies/{id}/vaccinations/ — list all vaccinations
        POST /api/v1/pregnancies/{id}/vaccinations/ — add a new vaccination record
        """
        pregnancy = self.get_object()

        if request.method == "GET":
            vaccinations = pregnancy.vaccinations.select_related("administered_by").order_by("due_week_start")
            return Response(VaccinationSerializer(vaccinations, many=True).data)

        serializer = VaccinationWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vaccination = services.create_vaccination(
            pregnancy=pregnancy,
            validated_data=serializer.validated_data,
            created_by=request.user,
        )
        return Response(VaccinationSerializer(vaccination).data, status=status.HTTP_201_CREATED)

    @action(
        detail=True, methods=["patch"],
        url_path=r"vaccinations/(?P<vacc_id>[0-9a-f-]+)",
    )
    def vaccination_detail(
        self, request: Request, pk: str | None = None, vacc_id: str | None = None,
    ) -> Response:
        """PATCH /api/v1/pregnancies/{id}/vaccinations/{vacc_id}/ — update vaccination status."""
        pregnancy = self.get_object()
        vaccination = Vaccination.objects.filter(id=vacc_id, pregnancy=pregnancy).first()
        if not vaccination:
            return Response({"detail": "Vaccination not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = VaccinationWriteSerializer(vaccination, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            vaccination = services.set_vaccination_status(
                vaccination=vaccination,
                validated_data=serializer.validated_data,
                updated_by=request.user,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(VaccinationSerializer(vaccination).data)

    # ── Wellness Plan sub-resource ────────────────────────────────────────────
    @action(detail=True, methods=["get", "put", "patch"], url_path="wellness-plan")
    def wellness_plan(self, request: Request, pk: str | None = None) -> Response:
        """
        GET         /api/v1/pregnancies/{id}/wellness-plan/ — retrieve (or create empty) wellness plan
        PUT/PATCH   /api/v1/pregnancies/{id}/wellness-plan/ — update wellness plan
        """
        pregnancy = self.get_object()

        if request.method == "GET":
            plan, _ = services.get_or_create_wellness_plan(
                pregnancy=pregnancy, created_by=request.user,
            )
            return Response(WellnessPlanSerializer(plan).data)

        # PUT / PATCH
        plan, _ = services.get_or_create_wellness_plan(
            pregnancy=pregnancy, created_by=request.user,
        )
        partial = request.method == "PATCH"
        serializer = WellnessPlanWriteSerializer(plan, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        plan = services.update_wellness_plan(
            plan=plan,
            validated_data=serializer.validated_data,
            updated_by=request.user,
        )
        return Response(WellnessPlanSerializer(plan).data)

    # ── Sync gestational week ─────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="sync-week")
    def sync_week(self, request: Request, pk: str | None = None) -> Response:
        """
        POST /api/v1/pregnancies/{id}/sync-week/
        Recalculate and persist gestational week + trimester from LMP.
        """
        pregnancy = self.get_object()
        pregnancy = services.sync_gestational_week(pregnancy)
        return Response(
            {
                "detail": "Gestational week synced.",
                "current_week": pregnancy.current_week,
                "trimester": pregnancy.trimester,
            }
        )
