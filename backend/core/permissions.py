"""
MotherCare — Custom DRF Permission Classes
RBAC enforcement at the API layer (NFR §7.2 — no client-side-only gating).

NOTE: Type annotations for DRF classes use string literals to avoid circular
imports at DRF settings load time.
"""
from __future__ import annotations

from typing import TYPE_CHECKING

from rest_framework.permissions import BasePermission

if TYPE_CHECKING:
    from rest_framework.request import Request
    from rest_framework.views import APIView


class IsAuthenticatedStaff(BasePermission):
    """
    Base permission: user must be authenticated via a valid UserSession token.
    All API endpoints require this permission.
    """

    message = "Authentication credentials were not provided or are invalid."

    def has_permission(self, request: Request, view: APIView) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.is_active)


class HasModulePermission(BasePermission):
    """
    RBAC permission check: user must have a Role that grants access to
    the specified module + action combination.

    Usage in a ViewSet:
        class PatientViewSet(ModelViewSet):
            permission_classes = [HasModulePermission]
            required_module = "patients"
            required_action = "read"   # or "write", "delete"
    """

    message = "You do not have permission to perform this action."

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False

        module = getattr(view, "required_module", None)
        action = getattr(view, "required_action", None)

        if not module or not action:
            return request.user.is_active

        return self._user_has_permission(request.user, module, action)

    def _user_has_permission(self, user: object, module: str, action: str) -> bool:
        """
        Check whether any of the user's roles grant the module+action permission.
        """
        from apps.auth_rbac.services import check_user_permission
        return check_user_permission(user_id=user.id, module=module, action=action)


class IsReadOnly(BasePermission):
    """Allow only safe HTTP methods (GET, HEAD, OPTIONS)."""

    def has_permission(self, request: Request, view: APIView) -> bool:
        return request.method in ("GET", "HEAD", "OPTIONS")


class IsSelf(BasePermission):
    """Object-level permission: user can only access their own record."""

    def has_object_permission(self, request: Request, view: APIView, obj: object) -> bool:
        return bool(hasattr(obj, "user") and obj.user == request.user) or obj == request.user


class IsDoctor(BasePermission):
    """
    Permission check: user must be authenticated, active, and have an associated Doctor profile.
    """

    message = "You must be registered as a Doctor to perform this action."

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated and request.user.is_active):
            return False
        try:
            return hasattr(request.user, "staff_profile") and hasattr(request.user.staff_profile, "doctor_profile")
        except AttributeError:
            return False

