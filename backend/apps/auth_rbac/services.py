"""
MotherCare — Auth RBAC Service Layer (stub)
Business logic for authentication and RBAC operations.
Full implementation in Sprint 1.
"""
from __future__ import annotations

import uuid


def check_user_permission(user_id: uuid.UUID, module: str, action: str) -> bool:
    """
    Check if a user has a role granting the specified module+action permission.
    Uses prefetched role→permission chain to avoid N+1 queries.

    Args:
        user_id: UUID of the user to check.
        module: Module name (e.g. 'patients', 'pharmacy').
        action: Action name (e.g. 'read', 'write', 'delete').

    Returns:
        True if the user has the permission, False otherwise.
    """
    from apps.auth_rbac.models import UserRole

    # Check via User → UserRole → Role → RolePermission → Permission chain
    return UserRole.objects.filter(
        user_id=user_id,
        role__role_permissions__permission__module=module,
        role__role_permissions__permission__action=action,
    ).exists()


def create_user_session(
    user: User,
    ip_address: str | None = None,
    user_agent: str = "",
    remember_me: bool = False,
) -> tuple[UserSession, str]:
    """
    Generate a raw token, hash it using SHA-256, and store the session record.
    Returns the UserSession object and the raw (unhashed) token string.
    """
    from datetime import timedelta
    from django.utils import timezone

    from apps.auth_rbac.models import UserSession
    from core.utils import generate_session_token, hash_token

    raw_token = generate_session_token()
    token_hash = hash_token(raw_token)

    # NFR §7.5 / G-03: 8 hours session, 30 days if remember_me
    duration = timedelta(days=30) if remember_me else timedelta(hours=8)
    issued_at = timezone.now()
    expires_at = issued_at + duration

    session = UserSession.objects.create(
        user=user,
        token_hash=token_hash,
        ip_address=ip_address,
        user_agent=user_agent,
        issued_at=issued_at,
        expires_at=expires_at,
        created_by=user,
    )
    return session, raw_token

