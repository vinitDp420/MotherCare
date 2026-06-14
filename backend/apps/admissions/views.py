"""
MotherCare — Admissions & Bed Management Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsAuthenticatedStaff
from core.pagination import StandardResultsPagination
from core.mixins import SoftDeleteMixin

from apps.admissions.models import Bed, Admission, WardTransfer
from apps.admissions.serializers import (
    BedSerializer,
    AdmissionListSerializer,
    AdmissionDetailSerializer,
    AdmissionWriteSerializer,
    WardTransferSerializer,
    TransferWardSerializer,
    DischargeSerializer,
)
from apps.admissions import services

class BedViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    filterset_fields = ["status", "ward_type", "floor"]
    search_fields = ["bed_number"]
    ordering_fields = ["bed_number", "floor", "last_cleaned_at"]
    ordering = ["bed_number"]

    @action(detail=True, methods=["post"], url_path="clean")
    def clean_bed(self, request, pk=None):
        bed = self.get_object()
        cleaned_bed = services.clean_bed(bed, updated_by=request.user)
        serializer = self.get_serializer(cleaned_bed)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdmissionViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    queryset = Admission.objects.select_related("patient", "bed", "doctor", "doctor__staff").all()
    filterset_fields = ["status", "admission_type", "patient", "doctor", "bed"]
    search_fields = ["patient__full_name", "patient__mrn", "doctor__staff__full_name", "bed__bed_number"]
    ordering_fields = ["admitted_at", "est_discharge", "actual_discharge"]
    ordering = ["-admitted_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return AdmissionListSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return AdmissionWriteSerializer
        return AdmissionDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        patient = serializer.validated_data["patient"]
        bed = serializer.validated_data["bed"]
        doctor = serializer.validated_data["doctor"]
        admission_type = serializer.validated_data["admission_type"]
        est_discharge = serializer.validated_data.get("est_discharge")
        notes = serializer.validated_data.get("notes", "")

        try:
            admission = services.admit_patient(
                patient=patient,
                bed=bed,
                doctor=doctor,
                admission_type=admission_type,
                est_discharge=est_discharge,
                notes=notes,
                created_by=request.user
            )
            # Fetch fresh detailed data
            detail_serializer = AdmissionDetailSerializer(admission)
            return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="transfer")
    def transfer(self, request, pk=None):
        admission = self.get_object()
        serializer = TransferWardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        to_bed = serializer.validated_data["to_bed"]
        reason = serializer.validated_data.get("reason", "")

        try:
            transfer = services.transfer_ward(
                admission=admission,
                to_bed=to_bed,
                reason=reason,
                transferred_by=request.user
            )
            transfer_serializer = WardTransferSerializer(transfer)
            return Response(transfer_serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="discharge")
    def discharge(self, request, pk=None):
        admission = self.get_object()
        serializer = DischargeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        actual_discharge = serializer.validated_data.get("actual_discharge")
        discharge_status = serializer.validated_data["status"]
        notes = serializer.validated_data.get("notes", "")

        try:
            discharged_admission = services.discharge_patient(
                admission=admission,
                actual_discharge=actual_discharge,
                status=discharge_status,
                notes=notes,
                updated_by=request.user
            )
            detail_serializer = AdmissionDetailSerializer(discharged_admission)
            return Response(detail_serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class WardTransferViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    queryset = WardTransfer.objects.select_related("admission", "from_bed", "to_bed", "transferred_by").all()
    serializer_class = WardTransferSerializer
    filterset_fields = ["admission", "from_bed", "to_bed", "transferred_by"]
    ordering = ["-transferred_at"]
