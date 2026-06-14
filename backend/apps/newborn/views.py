"""
MotherCare — Newborn Module Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from core.permissions import IsAuthenticatedStaff
from core.pagination import StandardResultsPagination
from core.mixins import SoftDeleteMixin
from apps.newborn.models import Newborn, NewbornVaccination, NewbornFeedingLog, NewbornVital
from apps.newborn.serializers import (
    NewbornListSerializer,
    NewbornDetailSerializer,
    NewbornWriteSerializer,
    NewbornFeedingLogSerializer,
    NewbornVitalSerializer,
    NewbornVaccinationSerializer,
)
from apps.newborn import services

class NewbornViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    queryset = Newborn.objects.select_related("delivery", "delivery__patient").prefetch_related("vaccinations", "feeding_logs", "vitals").all()
    filterset_fields = ["delivery", "gender", "condition", "nicu_required"]
    search_fields = ["baby_mrn", "notes"]
    ordering_fields = ["baby_mrn", "birth_weight_kg", "created_at"]
    ordering = ["baby_mrn"]

    def get_serializer_class(self):
        if self.action == "list":
            return NewbornListSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return NewbornWriteSerializer
        return NewbornDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            newborn = services.register_newborn(
                delivery=serializer.validated_data["delivery"],
                gender=serializer.validated_data["gender"],
                birth_weight_kg=serializer.validated_data["birth_weight_kg"],
                birth_length_cm=serializer.validated_data.get("birth_length_cm"),
                apgar_1min=serializer.validated_data["apgar_1min"],
                apgar_5min=serializer.validated_data["apgar_5min"],
                condition=serializer.validated_data.get("condition", "healthy"),
                nicu_required=serializer.validated_data.get("nicu_required", False),
                notes=serializer.validated_data.get("notes", ""),
                created_by=request.user
            )
            detail_serializer = NewbornDetailSerializer(newborn)
            return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get", "post"], url_path="feeding")
    def feeding(self, request, pk=None):
        newborn = self.get_object()
        if request.method == "POST":
            serializer = NewbornFeedingLogSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            try:
                log = services.record_feeding(
                    newborn=newborn,
                    feed_type=serializer.validated_data["feed_type"],
                    feed_time=serializer.validated_data.get("feed_time"),
                    volume_ml=serializer.validated_data.get("volume_ml"),
                    notes=serializer.validated_data.get("notes", ""),
                    created_by=request.user
                )
                return Response(NewbornFeedingLogSerializer(log).data, status=status.HTTP_201_CREATED)
            except ValueError as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # GET method
        logs = NewbornFeedingLog.objects.filter(newborn=newborn).order_by("-feed_time")
        page = self.paginate_queryset(logs)
        if page is not None:
            serializer = NewbornFeedingLogSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = NewbornFeedingLogSerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get", "post"], url_path="vitals")
    def vitals(self, request, pk=None):
        newborn = self.get_object()
        if request.method == "POST":
            serializer = NewbornVitalSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            vital = services.record_newborn_vital(
                newborn=newborn,
                weight_kg=serializer.validated_data["weight_kg"],
                head_circ_cm=serializer.validated_data.get("head_circ_cm"),
                temperature=serializer.validated_data.get("temperature"),
                recorded_at=serializer.validated_data.get("recorded_at"),
                recorded_by=request.user
            )
            return Response(NewbornVitalSerializer(vital).data, status=status.HTTP_201_CREATED)

        # GET method
        vitals = NewbornVital.objects.filter(newborn=newborn).order_by("-recorded_at")
        page = self.paginate_queryset(vitals)
        if page is not None:
            serializer = NewbornVitalSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = NewbornVitalSerializer(vitals, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="vaccinations")
    def vaccinations(self, request, pk=None):
        newborn = self.get_object()
        vaccinations = NewbornVaccination.objects.filter(newborn=newborn).order_by("vaccine_name", "dose_number")
        serializer = NewbornVaccinationSerializer(vaccinations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"], url_path="update-vaccination")
    def update_vaccination(self, request, pk=None):
        newborn = self.get_object()
        vaccination_id = request.data.get("vaccination_id")
        if not vaccination_id:
            return Response({"detail": "vaccination_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        vaccination = get_object_or_404(NewbornVaccination, id=vaccination_id, newborn=newborn)
        
        status_val = request.data.get("status")
        administered_date = request.data.get("administered_date")
        notes = request.data.get("notes", "")

        if not status_val:
            return Response({"detail": "status is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            updated_vac = services.set_newborn_vaccination_status(
                vaccination=vaccination,
                status=status_val,
                administered_date=administered_date,
                notes=notes,
                updated_by=request.user
            )
            return Response(NewbornVaccinationSerializer(updated_vac).data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
