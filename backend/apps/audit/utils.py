"""
apps/audit/utils.py — Audit logging utility
Called by core/models.py soft_delete() and by signals across all apps.
Full implementation in Sprint 9.
"""
from __future__ import annotations


def log_event(
    action_type: str,
    entity_name: str,
    entity_id: str,
    user: object = None,
    old_value: dict | None = None,
    new_value: dict | None = None,
    ip_address: str | None = None,
    user_agent: str = "",
) -> None:
    """
    Write an immutable AuditLog entry.
    Called for every: create, update, delete, login, logout, upload, download event.
    (BR-AUD-01)

    This is a stub — full implementation wired via Django signals in Sprint 9.
    """
    # Full implementation: create AuditLog record
    # Imported here to avoid circular imports at module load time
    pass  # noqa: PIE790
