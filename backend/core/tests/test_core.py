"""
Tests for core module: constants, exceptions, mixins, permissions, utils, managers, pagination.
"""
import hashlib
from datetime import date
from unittest.mock import MagicMock, patch

import pytest
from django.test import RequestFactory
from rest_framework import status
from rest_framework.test import APIRequestFactory

# ─────────────────────────────────────────────────────────────────────────────
# 1. Constants — just importing covers all statement lines
# ─────────────────────────────────────────────────────────────────────────────
from core.constants import (
    ALLOWED_DOCUMENT_TYPES,
    ALLOWED_LAB_REPORT_TYPES,
    BABY_MRN_PREFIX,
    BABY_MRN_SEQ_PADDING,
    BLOCKING_ALLERGY_SEVERITIES,
    DASHBOARD_KPI_CACHE_SECONDS,
    DEFAULT_SESSION_EXPIRY_HOURS,
    DELIVERY_FEED_POLL_INTERVAL_MS,
    FIFO_BATCH_LOCK_TIMEOUT,
    INVOICE_PREFIX,
    INVOICE_SEQ_PADDING,
    MAX_LAB_REPORT_FILES_PER_TEST,
    MAX_UPLOAD_SIZE_BYTES,
    NEAR_EXPIRY_DAYS_DEFAULT,
    NO_SHOW_GRACE_PERIOD_MINUTES,
    PATIENT_MRN_PREFIX,
    PHARMACY_INVOICE_PREFIX,
    PPH_CSECTION_THRESHOLD_ML,
    PPH_NORMAL_DELIVERY_THRESHOLD_ML,
    REMEMBER_ME_EXPIRY_HOURS,
    SESSION_TOKEN_LENGTH,
    TOKEN_NUMBER_START,
    WARNING_ALLERGY_SEVERITIES,
)


class TestConstants:
    """Verify constants have expected values and types."""

    def test_upload_size(self):
        assert MAX_UPLOAD_SIZE_BYTES == 52_428_800

    def test_mrn_prefix(self):
        assert PATIENT_MRN_PREFIX == "PT"
        assert BABY_MRN_PREFIX == "NB"

    def test_invoice_prefix(self):
        assert INVOICE_PREFIX == "INV"
        assert PHARMACY_INVOICE_PREFIX == "RX"

    def test_session_defaults(self):
        assert SESSION_TOKEN_LENGTH == 32
        assert DEFAULT_SESSION_EXPIRY_HOURS == 8
        assert REMEMBER_ME_EXPIRY_HOURS == 720

    def test_allergy_severities(self):
        assert "severe" in BLOCKING_ALLERGY_SEVERITIES
        assert "mild" in WARNING_ALLERGY_SEVERITIES

    def test_delivery_thresholds(self):
        assert PPH_NORMAL_DELIVERY_THRESHOLD_ML == 500
        assert PPH_CSECTION_THRESHOLD_ML == 1000

    def test_token_start(self):
        assert TOKEN_NUMBER_START == 101

    def test_lab_and_file_constants(self):
        assert MAX_LAB_REPORT_FILES_PER_TEST == 10
        assert "pdf" in ALLOWED_LAB_REPORT_TYPES
        assert "pdf" in ALLOWED_DOCUMENT_TYPES

    def test_misc_constants(self):
        assert NEAR_EXPIRY_DAYS_DEFAULT == 30
        assert FIFO_BATCH_LOCK_TIMEOUT == 5
        assert NO_SHOW_GRACE_PERIOD_MINUTES == 15
        assert INVOICE_SEQ_PADDING == 4
        assert BABY_MRN_SEQ_PADDING == 3
        assert DASHBOARD_KPI_CACHE_SECONDS == 30
        assert DELIVERY_FEED_POLL_INTERVAL_MS == 30_000


# ─────────────────────────────────────────────────────────────────────────────
# 2. Exceptions
# ─────────────────────────────────────────────────────────────────────────────
from core.exceptions import (
    BusinessRuleError,
    ConflictError,
    ImmutabilityError,
    mothercare_exception_handler,
)


class TestExceptions:
    """Test custom exception classes."""

    def test_business_rule_error_defaults(self):
        exc = BusinessRuleError("Some violation")
        assert exc.detail == "Some violation"
        assert exc.code == "business_rule_violation"
        assert exc.field is None
        assert str(exc) == "Some violation"

    def test_business_rule_error_with_field(self):
        exc = BusinessRuleError("Bad date", code="invalid_date", field="appointment_date")
        assert exc.code == "invalid_date"
        assert exc.field == "appointment_date"

    def test_conflict_error_defaults(self):
        exc = ConflictError("Already exists")
        assert exc.detail == "Already exists"
        assert exc.code == "conflict"
        assert exc.field is None

    def test_conflict_error_with_field(self):
        exc = ConflictError("Duplicate token", code="duplicate", field="token_number")
        assert exc.code == "duplicate"
        assert exc.field == "token_number"

    def test_immutability_error(self):
        exc = ImmutabilityError()
        assert exc.detail == "This record is immutable and cannot be modified."
        assert exc.code == "immutable_record"

    def test_immutability_error_custom_message(self):
        exc = ImmutabilityError("Cannot change prescription")
        assert exc.detail == "Cannot change prescription"


class TestExceptionHandler:
    """Test the global DRF exception handler."""

    def _make_context(self):
        factory = APIRequestFactory()
        request = factory.get("/")
        return {"request": request, "view": None}

    def test_handles_business_rule_error(self):
        exc = BusinessRuleError("Not allowed", field="status")
        ctx = self._make_context()
        response = mothercare_exception_handler(exc, ctx)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert response.data["detail"] == "Not allowed"
        assert response.data["code"] == "business_rule_violation"
        assert response.data["field"] == "status"

    def test_handles_business_rule_error_without_field(self):
        exc = BusinessRuleError("Not allowed")
        ctx = self._make_context()
        response = mothercare_exception_handler(exc, ctx)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "field" not in response.data

    def test_handles_conflict_error(self):
        exc = ConflictError("Already taken", field="token")
        ctx = self._make_context()
        response = mothercare_exception_handler(exc, ctx)
        assert response.status_code == status.HTTP_409_CONFLICT
        assert response.data["detail"] == "Already taken"
        assert response.data["field"] == "token"

    def test_handles_conflict_error_without_field(self):
        exc = ConflictError("Already taken")
        ctx = self._make_context()
        response = mothercare_exception_handler(exc, ctx)
        assert response.status_code == status.HTTP_409_CONFLICT
        assert "field" not in response.data

    def test_handles_immutability_error(self):
        exc = ImmutabilityError()
        ctx = self._make_context()
        response = mothercare_exception_handler(exc, ctx)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data["code"] == "immutable_record"

    def test_unknown_exception_returns_none(self):
        exc = RuntimeError("something broke")
        ctx = self._make_context()
        response = mothercare_exception_handler(exc, ctx)
        assert response is None


# ─────────────────────────────────────────────────────────────────────────────
# 3. Mixins
# ─────────────────────────────────────────────────────────────────────────────
from core.mixins import ImmutableMixin, SoftDeleteMixin


class TestImmutableMixin:
    """Test that ImmutableMixin blocks update/delete."""

    def test_update_raises_immutability_error(self):
        mixin = ImmutableMixin()
        with pytest.raises(ImmutabilityError):
            mixin.update(request=None)

    def test_partial_update_raises_immutability_error(self):
        mixin = ImmutableMixin()
        with pytest.raises(ImmutabilityError):
            mixin.partial_update(request=None)

    def test_destroy_raises_immutability_error(self):
        mixin = ImmutableMixin()
        with pytest.raises(ImmutabilityError):
            mixin.destroy(request=None)


class TestSoftDeleteMixin:
    """Test SoftDeleteMixin behavior."""

    def test_destroy_calls_soft_delete(self):
        mixin = SoftDeleteMixin()
        instance = MagicMock()
        instance.is_deleted = False
        request = MagicMock()
        mixin.get_object = MagicMock(return_value=instance)
        response = mixin.destroy(request)
        instance.soft_delete.assert_called_once_with(user=request.user)
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_destroy_already_deleted_returns_400(self):
        mixin = SoftDeleteMixin()
        instance = MagicMock()
        instance.is_deleted = True
        request = MagicMock()
        mixin.get_object = MagicMock(return_value=instance)
        response = mixin.destroy(request)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["code"] == "already_deleted"

    def test_restore_calls_restore_on_instance(self):
        mixin = SoftDeleteMixin()
        instance = MagicMock()
        request = MagicMock()
        mixin.get_object = MagicMock(return_value=instance)
        mixin.get_serializer = MagicMock(return_value=MagicMock(data={"id": "123"}))
        response = mixin.restore(request)
        instance.restore.assert_called_once_with(user=request.user)
        assert response.status_code == status.HTTP_200_OK


# ─────────────────────────────────────────────────────────────────────────────
# 4. Permissions
# ─────────────────────────────────────────────────────────────────────────────
from core.permissions import HasModulePermission, IsAuthenticatedStaff, IsReadOnly, IsSelf


class TestIsAuthenticatedStaff:
    """Test IsAuthenticatedStaff permission."""

    def test_authenticated_active_user_allowed(self):
        perm = IsAuthenticatedStaff()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_active = True
        assert perm.has_permission(request, None) is True

    def test_unauthenticated_user_denied(self):
        perm = IsAuthenticatedStaff()
        request = MagicMock()
        request.user.is_authenticated = False
        request.user.is_active = True
        assert perm.has_permission(request, None) is False

    def test_inactive_user_denied(self):
        perm = IsAuthenticatedStaff()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_active = False
        assert perm.has_permission(request, None) is False

    def test_no_user_denied(self):
        perm = IsAuthenticatedStaff()
        request = MagicMock()
        request.user = None
        assert perm.has_permission(request, None) is False


class TestHasModulePermission:
    """Test HasModulePermission RBAC check."""

    def test_unauthenticated_denied(self):
        perm = HasModulePermission()
        request = MagicMock()
        request.user.is_authenticated = False
        assert perm.has_permission(request, MagicMock()) is False

    def test_no_module_or_action_falls_back_to_is_active(self):
        perm = HasModulePermission()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_active = True
        view = MagicMock(spec=[])  # no required_module or required_action attrs
        assert perm.has_permission(request, view) is True

    @patch("core.permissions.HasModulePermission._user_has_permission", return_value=True)
    def test_with_module_and_action_checks_permission(self, mock_check):
        perm = HasModulePermission()
        request = MagicMock()
        request.user.is_authenticated = True
        view = MagicMock()
        view.required_module = "patients"
        view.required_action = "read"
        assert perm.has_permission(request, view) is True
        mock_check.assert_called_once_with(request.user, "patients", "read")


class TestIsReadOnly:
    """Test IsReadOnly permission."""

    def test_get_allowed(self):
        perm = IsReadOnly()
        request = MagicMock()
        request.method = "GET"
        assert perm.has_permission(request, None) is True

    def test_head_allowed(self):
        perm = IsReadOnly()
        request = MagicMock()
        request.method = "HEAD"
        assert perm.has_permission(request, None) is True

    def test_options_allowed(self):
        perm = IsReadOnly()
        request = MagicMock()
        request.method = "OPTIONS"
        assert perm.has_permission(request, None) is True

    def test_post_denied(self):
        perm = IsReadOnly()
        request = MagicMock()
        request.method = "POST"
        assert perm.has_permission(request, None) is False

    def test_put_denied(self):
        perm = IsReadOnly()
        request = MagicMock()
        request.method = "PUT"
        assert perm.has_permission(request, None) is False


class TestIsSelf:
    """Test IsSelf object-level permission."""

    def test_same_user_allowed(self):
        perm = IsSelf()
        user = MagicMock()
        request = MagicMock()
        request.user = user
        obj = MagicMock()
        obj.user = user
        assert perm.has_object_permission(request, None, obj) is True

    def test_different_user_denied(self):
        perm = IsSelf()
        request = MagicMock()
        request.user = MagicMock()
        obj = MagicMock()
        obj.user = MagicMock()
        assert perm.has_object_permission(request, None, obj) is False

    def test_obj_is_user_allowed(self):
        """When obj IS the user (e.g., /me/ endpoint)."""
        perm = IsSelf()
        user = MagicMock()
        request = MagicMock()
        request.user = user
        obj = user  # obj IS the request user
        assert perm.has_object_permission(request, None, obj) is True


# ─────────────────────────────────────────────────────────────────────────────
# 5. Utils — session token & hash functions (no DB needed)
# ─────────────────────────────────────────────────────────────────────────────
from core.utils import generate_session_token, hash_token


class TestSessionTokenUtils:
    """Test session token generation and hashing."""

    def test_generate_session_token_length(self):
        token = generate_session_token()
        assert isinstance(token, str)
        assert len(token) > 30  # URL-safe base64 of 32 bytes

    def test_generate_session_token_unique(self):
        tokens = {generate_session_token() for _ in range(100)}
        assert len(tokens) == 100  # All unique

    def test_hash_token(self):
        raw = "test-token-abc"
        expected = hashlib.sha256(raw.encode()).hexdigest()
        assert hash_token(raw) == expected

    def test_hash_token_deterministic(self):
        raw = "another-token"
        assert hash_token(raw) == hash_token(raw)


# ─────────────────────────────────────────────────────────────────────────────
# 6. Models — SoftDeleteModel and BaseModel (DB tests)
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestSoftDeleteModelRestore:
    """Test the restore() method on SoftDeleteModel via Patient."""

    def test_restore_non_deleted_raises(self):
        from apps.people.tests.factories import PatientFactory
        patient = PatientFactory()
        with pytest.raises(ValueError, match="is not deleted"):
            patient.restore()

    def test_restore_deleted_record(self):
        from apps.people.tests.factories import PatientFactory
        patient = PatientFactory()
        patient.soft_delete()
        assert patient.is_deleted is True
        patient.restore()
        assert patient.is_deleted is False
        assert patient.deleted_at is None

    def test_soft_delete_audit_exception_does_not_break(self):
        """Ensure _write_soft_delete_audit swallows exceptions."""
        from apps.people.tests.factories import PatientFactory
        patient = PatientFactory()
        with patch("core.models.SoftDeleteModel._write_soft_delete_audit", side_effect=Exception("audit fail")):
            # The soft_delete should still work even if audit fails
            # But since we patch the method on the class, the save still happens
            # Let's instead patch the log_event inside the method
            pass

        # Test that the except branch in _write_soft_delete_audit is covered
        with patch("apps.audit.utils.log_event", side_effect=RuntimeError("boom")):
            patient._write_soft_delete_audit(user=None)
            # Should not raise — exception is caught


# ─────────────────────────────────────────────────────────────────────────────
# 7. Managers — SoftDeleteManager
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestSoftDeleteManager:
    """Test SoftDeleteManager filtered querysets."""

    def test_deleted_method_returns_only_deleted(self):
        from apps.people.models import Patient
        from apps.people.tests.factories import PatientFactory

        p1 = PatientFactory()
        p2 = PatientFactory()
        p2.soft_delete()

        # objects.deleted() should only include the soft-deleted patient
        deleted_qs = Patient.objects.deleted()
        assert p2.id in [p.id for p in deleted_qs]
        assert p1.id not in [p.id for p in deleted_qs]

    def test_with_deleted_returns_all(self):
        from apps.people.models import Patient
        from apps.people.tests.factories import PatientFactory

        p1 = PatientFactory()
        p2 = PatientFactory()
        p2.soft_delete()

        all_qs = Patient.objects.with_deleted()
        all_ids = [p.id for p in all_qs]
        assert p1.id in all_ids
        assert p2.id in all_ids
