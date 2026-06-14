"""
MotherCare — ViewSet Mixins
Reusable ViewSet behavior for soft delete and immutability enforcement.
"""
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.exceptions import ImmutabilityError


class SoftDeleteMixin:
    """
    Mixin for ModelViewSet subclasses that should use soft delete
    instead of hard DELETE.

    Overrides destroy() to call model.soft_delete() instead of model.delete().
    Adds a restore() action for admin use.
    """

    def destroy(self, request: object, *args: object, **kwargs: object) -> Response:
        """Perform soft delete instead of hard DELETE."""
        instance = self.get_object()

        if instance.is_deleted:
            return Response(
                {"detail": "This record has already been deleted.", "code": "already_deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance.soft_delete(user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="restore")
    def restore(self, request: object, *args: object, **kwargs: object) -> Response:
        """Restore a soft-deleted record (admin only)."""
        # Use all_objects to find deleted records
        instance = self.get_object()  # Will use all_objects queryset if configured
        instance.restore(user=request.user)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ImmutableMixin:
    """
    Mixin for ViewSets backed by immutable models
    (Prescription, PrescriptionItem, LabReportFile, AuditLog).

    Disables update and destroy operations at the API layer.
    """

    def update(self, request: object, *args: object, **kwargs: object) -> None:
        raise ImmutabilityError()

    def partial_update(self, request: object, *args: object, **kwargs: object) -> None:
        raise ImmutabilityError()

    def destroy(self, request: object, *args: object, **kwargs: object) -> None:
        raise ImmutabilityError()
