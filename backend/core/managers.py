"""
MotherCare — Core Custom Managers
Provides the SoftDeleteManager used by all soft-deletable clinical entities.
"""
from django.db import models


class SoftDeleteManager(models.Manager):
    """
    Default manager for SoftDeleteModel subclasses.

    Automatically filters out soft-deleted records (is_deleted=False).
    This is the default manager — ALL queries on these models use this filter
    unless explicitly using model.all_objects.

    CLAUDE.md requirement:
        All application queries on soft-delete tables must use the
        default manager which filters is_deleted=False.
        Raw queries that bypass this filter are forbidden.
    """

    def get_queryset(self) -> models.QuerySet:
        """Return only non-deleted records."""
        return super().get_queryset().filter(is_deleted=False)

    def deleted(self) -> models.QuerySet:
        """Return only soft-deleted records (for admin/audit use)."""
        return super().get_queryset().filter(is_deleted=True)

    def with_deleted(self) -> models.QuerySet:
        """Return all records including soft-deleted (for admin/audit use)."""
        return super().get_queryset()
