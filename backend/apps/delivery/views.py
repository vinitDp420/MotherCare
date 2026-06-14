"""
MotherCare — Delivery Module Views
"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from core.permissions import IsAuthenticatedStaff
from core.pagination import StandardResultsPagination
from core.mixins import SoftDeleteMixin
from apps.delivery.models import Delivery
from apps.delivery.serializers import (
    DeliveryListSerializer,
    DeliveryDetailSerializer,
    DeliveryWriteSerializer,
)
from apps.delivery import services

class DeliveryViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    queryset = Delivery.objects.select_related("patient", "doctor", "doctor__staff", "admission").prefetch_related("procedures").all()
    filterset_fields = ["admission", "patient", "doctor", "delivery_mode"]
    search_fields = ["patient__full_name", "patient__mrn", "doctor__staff__full_name"]
    ordering_fields = ["delivery_datetime", "blood_loss_ml"]
    ordering = ["-delivery_datetime"]

    def get_serializer_class(self):
        if self.action == "list":
            return DeliveryListSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return DeliveryWriteSerializer
        return DeliveryDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        admission = serializer.validated_data["admission"]
        patient = serializer.validated_data["patient"]
        doctor = serializer.validated_data["doctor"]
        delivery_datetime = serializer.validated_data["delivery_datetime"]
        delivery_mode = serializer.validated_data["delivery_mode"]
        blood_loss_ml = serializer.validated_data.get("blood_loss_ml")
        placenta_complete = serializer.validated_data.get("placenta_complete", True)
        complications = serializer.validated_data.get("complications", "")
        notes = serializer.validated_data.get("notes", "")
        procedures_data = serializer.validated_data.get("procedures", [])

        try:
            delivery = services.record_delivery(
                admission=admission,
                patient=patient,
                doctor=doctor,
                delivery_datetime=delivery_datetime,
                delivery_mode=delivery_mode,
                blood_loss_ml=blood_loss_ml,
                placenta_complete=placenta_complete,
                complications=complications,
                notes=notes,
                procedures_data=procedures_data,
                created_by=request.user
            )
            detail_serializer = DeliveryDetailSerializer(delivery)
            return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete of delivery requires Admin role (BR-DEL-08).
        """
        delivery = self.get_object()
        is_admin = request.user.is_superuser or request.user.user_roles.filter(role__name="Admin").exists()
        if not is_admin:
            raise PermissionDenied("Only users with Admin role can delete a delivery record.")

        services.soft_delete_delivery(delivery, deleted_by=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
