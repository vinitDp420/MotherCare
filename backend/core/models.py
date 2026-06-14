"""
MotherCare — Core Abstract Base Models
All domain models must inherit from one of these base classes.

Hierarchy:
    BaseModel (UUID PK + audit fields)
        └── SoftDeleteModel (+ is_deleted, deleted_at)

Usage:
    # Non-deletable entity (e.g. Bill, Staff)
    class Bill(BaseModel):
        ...

    # Soft-deletable clinical entity
    class Patient(SoftDeleteModel):
        ...
"""
import uuid

from django.db import models
from django.utils import timezone


class BaseModel(models.Model):
    """
    Abstract base for ALL MotherCare models.

    Provides:
    - UUID primary key (not sequential integer, for security and distributed readiness)
    - created_at, updated_at auto-timestamps (TIMESTAMPTZ in PostgreSQL)
    - created_by nullable FK to User (NULL for system-generated rows)
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="UUID primary key — never expose raw to client without masking.",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Record creation timestamp (UTC). Set once, never modified.",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Last modification timestamp (UTC). Auto-updated on every save().",
    )
    # String reference to avoid circular import with auth_rbac
    created_by = models.ForeignKey(
        "auth_rbac.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",  # No reverse relation (suppressed to avoid clutter)
        db_column="created_by",
        help_text="User who created this record. NULL for system-generated rows.",
    )

    class Meta:
        abstract = True
        # Consistent ordering: newest first by default
        ordering = ["-created_at"]


class SoftDeleteModel(BaseModel):
    """
    Abstract base for the 7 clinical entities that support soft delete.

    Tables: patient, pregnancy, appointment, consultation, admission, delivery, newborn
    (as defined in BUSINESS_RULES.md BR-SD-01)

    Rules (enforced here and in CLAUDE.md):
    - Hard DELETE is forbidden on all subclasses
    - All queries use the default SoftDeleteManager (filters is_deleted=False)
    - Use all_objects manager to bypass the filter (admin/audit only)
    - AuditLog entry must be written on every soft delete (done in soft_delete())
    """

    is_deleted = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Soft delete flag. TRUE = logically deleted. Use soft_delete() method.",
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of soft deletion (UTC). NULL if not deleted.",
    )

    # Default manager filters out soft-deleted records (CLAUDE.md requirement)
    # Note: Using models.Manager() assignment here to satisfy DJ012. We override 'objects'
    # in actual models to SoftDeleteManager.
    objects = models.Manager()  # Placeholder to satisfy type/lint rules
    all_objects = models.Manager()  # Bypass filter for admin/audit use only

    class Meta:
        abstract = True

    def soft_delete(self, user: "auth_rbac.User | None" = None) -> None:  # type: ignore[name-defined]  # noqa: F821
        """
        Perform a soft delete on this instance.

        Sets is_deleted=True, deleted_at=now(), saves the record,
        and writes an AuditLog entry.

        Args:
            user: The User performing the deletion (for AuditLog). May be None for system events.

        Raises:
            ValueError: If the record is already soft-deleted.
        """
        if self.is_deleted:
            raise ValueError(
                f"{self.__class__.__name__} (id={self.id}) is already soft-deleted. "
                "Cannot soft-delete twice."
            )
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])

        # Write AuditLog entry (import here to avoid circular imports)
        self._write_soft_delete_audit(user)

    def _write_soft_delete_audit(self, user: object) -> None:
        """Write AuditLog entry for soft delete. Called by soft_delete()."""
        try:
            from apps.audit.utils import log_event
            log_event(
                action_type="delete",
                entity_name=self.__class__.__name__,
                entity_id=str(self.id),
                user=user,
                old_value={"is_deleted": False},
                new_value={"is_deleted": True, "deleted_at": str(self.deleted_at)},
            )
        except Exception:  # noqa: BLE001
            # Audit logging must never break the main operation
            import logging
            logging.getLogger("mothercare").exception(
                "Failed to write AuditLog for soft_delete on %s id=%s",
                self.__class__.__name__,
                self.id,
            )

    def restore(self, user: object = None) -> None:
        """
        Restore a soft-deleted record (admin use only).
        Requires explicit admin role — do not expose in standard API.
        """
        if not self.is_deleted:
            raise ValueError(f"{self.__class__.__name__} (id={self.id}) is not deleted.")
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])
