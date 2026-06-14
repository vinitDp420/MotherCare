"""
MotherCare — People Module ViewSets
Architecture: CLAUDE.md — "Views — Orchestration only: call serializer → call service → return response"

ViewSets:
    PatientViewSet  — /api/v1/patients/
    StaffViewSet    — /api/v1/staff/
    DoctorViewSet   — /api/v1/doctors/
"""
from __future__ import annotations

import logging
from typing import Any

from django.contrib.postgres.search import TrigramSimilarity
from django.db.models import Q, QuerySet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.people import services
from apps.people.models import (
    Doctor,
    Patient,
    PatientAllergy,
    PatientEmergencyContact,
    Staff,
)
from apps.people.serializers import (
    DoctorDetailSerializer,
    DoctorListSerializer,
    DoctorWriteSerializer,
    PatientAllergySerializer,
    PatientAllergyWriteSerializer,
    PatientDetailSerializer,
    PatientEmergencyContactSerializer,
    PatientEmergencyContactWriteSerializer,
    PatientListSerializer,
    PatientWriteSerializer,
    StaffDetailSerializer,
    StaffListSerializer,
    StaffWriteSerializer,
)
from core.pagination import StandardResultsPagination
from core.permissions import IsAuthenticatedStaff

logger = logging.getLogger("mothercare")


# ─────────────────────────────────────────────────────────────────────────────
# Patient ViewSet
# /api/v1/patients/
# /api/v1/patients/{id}/allergies/
# /api/v1/patients/{id}/emergency-contacts/
# ─────────────────────────────────────────────────────────────────────────────
class PatientViewSet(viewsets.ModelViewSet):
    """
    CRUD for Patient records.

    list:       GET  /api/v1/patients/
    retrieve:   GET  /api/v1/patients/{id}/
    create:     POST /api/v1/patients/
    update:     PUT  /api/v1/patients/{id}/
    partial_update: PATCH /api/v1/patients/{id}/
    destroy:    DELETE /api/v1/patients/{id}/   → soft delete only

    Sub-resources:
        allergies:         GET/POST   /api/v1/patients/{id}/allergies/
        allergy_detail:    DELETE     /api/v1/patients/{id}/allergies/{allergy_id}/
        emergency_contacts: GET/POST  /api/v1/patients/{id}/emergency-contacts/
        emergency_contact_detail: DELETE /api/v1/patients/{id}/emergency-contacts/{link_id}/
    """

    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["is_active", "blood_group"]
    ordering_fields = ["full_name", "created_at", "mrn"]
    ordering = ["-created_at"]

    def get_queryset(self) -> QuerySet:
        """
        Default: non-deleted patients only (SoftDeleteManager).
        Supports search by MRN (exact), phone (exact), full_name (trigram fuzzy).
        BR-PAT-07: Patient search supports MRN, full name (trigram fuzzy), phone.
        """
        qs = Patient.objects.all()

        search = self.request.query_params.get("search", "").strip()
        if search:
            from django.db import connection
            use_trigram = False
            if connection.vendor == "postgresql":
                try:
                    with connection.cursor() as cur:
                        cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'")
                        use_trigram = cur.fetchone() is not None
                except Exception:  # noqa: BLE001
                    use_trigram = False

            if use_trigram:
                qs = qs.annotate(
                    name_similarity=TrigramSimilarity("full_name", search),
                ).filter(
                    Q(mrn__iexact=search)
                    | Q(phone__iexact=search)
                    | Q(name_similarity__gte=0.2)
                ).order_by("-name_similarity")
            else:
                qs = qs.filter(
                    Q(mrn__iexact=search)
                    | Q(phone__iexact=search)
                    | Q(full_name__icontains=search)
                )

        return qs.select_related("created_by")

    def get_serializer_class(self) -> type[serializers.Serializer]:
        if self.action == "list":
            return PatientListSerializer
        if self.action in ("create", "update", "partial_update"):
            return PatientWriteSerializer
        return PatientDetailSerializer

    def perform_create(self, serializer: serializers.Serializer) -> None:
        """Delegate to service layer. MRN is generated there."""
        services.create_patient(
            validated_data=serializer.validated_data,
            created_by=self.request.user,
        )

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        patient = services.create_patient(
            validated_data=serializer.validated_data,
            created_by=request.user,
        )
        out = PatientDetailSerializer(patient, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    def update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        partial = kwargs.pop("partial", False)
        patient = self.get_object()
        serializer = PatientWriteSerializer(
            patient, data=request.data, partial=partial,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        patient = services.update_patient(
            patient=patient,
            validated_data=serializer.validated_data,
            updated_by=request.user,
        )
        out = PatientDetailSerializer(patient, context={"request": request})
        return Response(out.data)

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Soft-delete only — BR-PAT-10: Hard DELETE is forbidden."""
        patient = self.get_object()
        services.soft_delete_patient(patient=patient, deleted_by=request.user)
        return Response(
            {"detail": f"Patient {patient.mrn} has been soft-deleted."},
            status=status.HTTP_200_OK,
        )

    # ── Allergies sub-resource ────────────────────────────────────────────────
    @action(detail=True, methods=["get", "post"], url_path="allergies")
    def allergies(self, request: Request, pk: str | None = None) -> Response:
        """
        GET  /api/v1/patients/{id}/allergies/ — list patient allergies
        POST /api/v1/patients/{id}/allergies/ — add new allergy
        """
        patient = self.get_object()

        if request.method == "GET":
            allergy_qs = patient.allergies.order_by("-severity", "-recorded_date")
            page = self.paginate_queryset(allergy_qs)
            if page is not None:
                serializer = PatientAllergySerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = PatientAllergySerializer(allergy_qs, many=True)
            return Response(serializer.data)

        # POST
        serializer = PatientAllergyWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        allergy = services.record_patient_allergy(
            patient=patient,
            validated_data=serializer.validated_data,
            recorded_by=request.user,
        )
        out = PatientAllergySerializer(allergy)
        return Response(out.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True, methods=["delete"],
        url_path=r"allergies/(?P<allergy_id>[0-9a-f-]+)",
    )
    def allergy_detail(
        self, request: Request, pk: str | None = None, allergy_id: str | None = None,
    ) -> Response:
        """DELETE /api/v1/patients/{id}/allergies/{allergy_id}/"""
        patient = self.get_object()
        allergy = PatientAllergy.objects.filter(id=allergy_id, patient=patient).first()
        if not allergy:
            return Response(
                {"detail": "Allergy not found for this patient."},
                status=status.HTTP_404_NOT_FOUND,
            )
        services.delete_patient_allergy(allergy=allergy, deleted_by=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── Emergency Contacts sub-resource ───────────────────────────────────────
    @action(detail=True, methods=["get", "post"], url_path="emergency-contacts")
    def emergency_contacts(self, request: Request, pk: str | None = None) -> Response:
        """
        GET  /api/v1/patients/{id}/emergency-contacts/ — list emergency contacts
        POST /api/v1/patients/{id}/emergency-contacts/ — add contact
        """
        patient = self.get_object()

        if request.method == "GET":
            links = (
                patient.emergency_contacts
                .select_related("contact")
                .order_by("priority")
            )
            serializer = PatientEmergencyContactSerializer(links, many=True)
            return Response(serializer.data)

        # POST
        serializer = PatientEmergencyContactWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        link = services.add_emergency_contact(
            patient=patient,
            validated_data=serializer.validated_data,
            created_by=request.user,
        )
        out = PatientEmergencyContactSerializer(link)
        return Response(out.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True, methods=["delete"],
        url_path=r"emergency-contacts/(?P<link_id>[0-9a-f-]+)",
    )
    def emergency_contact_detail(
        self, request: Request, pk: str | None = None, link_id: str | None = None,
    ) -> Response:
        """DELETE /api/v1/patients/{id}/emergency-contacts/{link_id}/"""
        patient = self.get_object()
        link = PatientEmergencyContact.objects.filter(
            id=link_id, patient=patient,
        ).select_related("contact").first()
        if not link:
            return Response(
                {"detail": "Emergency contact link not found for this patient."},
                status=status.HTTP_404_NOT_FOUND,
            )
        services.remove_emergency_contact(link=link, deleted_by=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────────────────────
# Staff ViewSet
# /api/v1/staff/
# ─────────────────────────────────────────────────────────────────────────────
class StaffViewSet(viewsets.ModelViewSet):
    """
    CRUD for Staff members.

    list:       GET  /api/v1/staff/
    retrieve:   GET  /api/v1/staff/{id}/
    create:     POST /api/v1/staff/
    update:     PUT  /api/v1/staff/{id}/
    partial_update: PATCH /api/v1/staff/{id}/
    destroy:    DELETE /api/v1/staff/{id}/
    """

    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active", "department"]
    search_fields = ["full_name", "designation", "phone", "email"]
    ordering_fields = ["full_name", "join_date", "created_at"]
    ordering = ["full_name"]

    def get_queryset(self) -> QuerySet:
        return Staff.objects.select_related(
            "user", "department", "doctor_profile",
        ).all()

    def get_serializer_class(self) -> type[serializers.Serializer]:
        if self.action == "list":
            return StaffListSerializer
        if self.action in ("create", "update", "partial_update"):
            return StaffWriteSerializer
        return StaffDetailSerializer

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = StaffWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        staff = services.create_staff(
            validated_data=serializer.validated_data,
            created_by=request.user,
        )
        out = StaffDetailSerializer(staff, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    def update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        partial = kwargs.pop("partial", False)
        staff = self.get_object()
        serializer = StaffWriteSerializer(
            staff, data=request.data, partial=partial,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        staff = services.update_staff(
            staff=staff,
            validated_data=serializer.validated_data,
            updated_by=request.user,
        )
        out = StaffDetailSerializer(staff, context={"request": request})
        return Response(out.data)


# ─────────────────────────────────────────────────────────────────────────────
# Doctor ViewSet
# /api/v1/doctors/
# ─────────────────────────────────────────────────────────────────────────────
class DoctorViewSet(viewsets.ModelViewSet):
    """
    CRUD for Doctor credentials.

    list:       GET  /api/v1/doctors/
    retrieve:   GET  /api/v1/doctors/{id}/
    create:     POST /api/v1/doctors/
    update:     PUT  /api/v1/doctors/{id}/
    partial_update: PATCH /api/v1/doctors/{id}/
    destroy:    DELETE /api/v1/doctors/{id}/
    """

    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["staff__is_active", "staff__department"]
    search_fields = ["staff__full_name", "specialisation", "registration_no"]
    ordering_fields = ["staff__full_name", "specialisation", "created_at"]
    ordering = ["staff__full_name"]

    def get_queryset(self) -> QuerySet:
        return Doctor.objects.select_related(
            "staff", "staff__user", "staff__department",
        ).all()

    def get_serializer_class(self) -> type[serializers.Serializer]:
        if self.action == "list":
            return DoctorListSerializer
        if self.action in ("create", "update", "partial_update"):
            return DoctorWriteSerializer
        return DoctorDetailSerializer

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = DoctorWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        doctor = services.create_doctor(
            validated_data=serializer.validated_data,
            created_by=request.user,
        )
        out = DoctorDetailSerializer(doctor, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    def update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        partial = kwargs.pop("partial", False)
        doctor = self.get_object()
        serializer = DoctorWriteSerializer(
            doctor, data=request.data, partial=partial,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        doctor = services.update_doctor(
            doctor=doctor,
            validated_data=serializer.validated_data,
            updated_by=request.user,
        )
        out = DoctorDetailSerializer(doctor, context={"request": request})
        return Response(out.data)
