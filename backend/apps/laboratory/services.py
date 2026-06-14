"""
MotherCare — Laboratory Module Services
Architecture: CLAUDE.md — "Service layer: all business logic lives here"

Services:
    order_lab_test(validated_data, created_by)
    update_lab_status(lab_test, new_status, key_findings, updated_by)
    upload_lab_report(lab_test, file_url, file_type, notes, uploaded_by)
    flag_lab_test(lab_test, updated_by)
    get_lab_queue(urgency_filter, status_filter)
    get_flagged_results(limit)

Business Rules:
    BR-LAB-01: LabReportFile is append-only (no update/delete)
    BR-LAB-02: Critical status auto-flags; flagged results create alerts
    BR-LAB-03: STAT > Urgent > Routine priority in queue
    BR-LAB-05: One-directional status transitions
"""
from __future__ import annotations

import logging
from typing import Any

from django.db import transaction
from django.db.models import Case, IntegerField, QuerySet, Value, When
from django.utils import timezone

from apps.laboratory.constants import (
    LAB_STATUS_TRANSITIONS,
    STATUS_CRITICAL,
    STATUS_PENDING,
    TERMINAL_LAB_STATUSES,
    URGENCY_STAT,
    URGENCY_URGENT,
)
from apps.laboratory.models import LabReportFile, LabTest

logger = logging.getLogger("mothercare")


# ─────────────────────────────────────────────────────────────────────────────
# Audit helper
# ─────────────────────────────────────────────────────────────────────────────

def _write_audit(
    action_type: str,
    entity_name: str,
    entity_id: str,
    user: object,
    old_value: dict | None = None,
    new_value: dict | None = None,
) -> None:
    """Write AuditLog. Failures never re-raise."""
    try:
        from apps.audit.utils import log_event
        log_event(
            action_type=action_type,
            entity_name=entity_name,
            entity_id=entity_id,
            user=user,
            old_value=old_value or {},
            new_value=new_value or {},
        )
    except Exception:  # noqa: BLE001
        logger.exception("AuditLog write failed for %s %s", entity_name, entity_id)


# ─────────────────────────────────────────────────────────────────────────────
# Lab Test Ordering
# ─────────────────────────────────────────────────────────────────────────────

@transaction.atomic
def order_lab_test(
    validated_data: dict[str, Any],
    created_by: object = None,
) -> LabTest:
    """
    Create a new LabTest order.

    Args:
        validated_data: Dict with patient, ordered_by, test_type, urgency,
                        consultation (optional), notes (optional).
        created_by: User placing the order.

    Returns:
        Created LabTest instance with status=pending.
    """
    # notes is an extra field not on the model; extract separately
    _ = validated_data.pop("notes", "")

    lab_test = LabTest.objects.create(
        created_by=created_by,
        **validated_data,
    )

    _write_audit(
        action_type="create",
        entity_name="LabTest",
        entity_id=str(lab_test.id),
        user=created_by,
        new_value={
            "test_type": lab_test.test_type,
            "urgency": lab_test.urgency,
            "patient_id": str(lab_test.patient_id),
        },
    )

    logger.info(
        "LabTest ordered: id=%s type=%s urgency=%s patient=%s",
        lab_test.id, lab_test.test_type, lab_test.urgency, lab_test.patient_id,
    )
    return lab_test


# ─────────────────────────────────────────────────────────────────────────────
# Status Transitions
# ─────────────────────────────────────────────────────────────────────────────

@transaction.atomic
def update_lab_status(
    lab_test: LabTest,
    new_status: str,
    key_findings: str = "",
    updated_by: object = None,
) -> LabTest:
    """
    Advance lab test status via the state machine.

    Business Rules:
        BR-LAB-05: Transitions must be valid per LAB_STATUS_TRANSITIONS
        BR-LAB-02: STATUS_CRITICAL auto-sets flagged=True and completed_at
        STATUS_COMPLETED also sets completed_at

    Raises:
        ValueError: If the transition is not allowed.
    """
    allowed = LAB_STATUS_TRANSITIONS.get(lab_test.status, set())
    if new_status not in allowed:
        if lab_test.status in TERMINAL_LAB_STATUSES:
            raise ValueError(
                f"Lab test is in terminal status '{lab_test.status}' — no further transitions allowed."
            )
        raise ValueError(
            f"Invalid status transition: '{lab_test.status}' → '{new_status}'. "
            f"Allowed: {allowed or 'none (terminal)'}. [BR-LAB-05]"
        )

    old_status = lab_test.status
    update_fields = ["status", "updated_at"]

    lab_test.status = new_status

    # BR-LAB-02: Critical → auto-flag
    if new_status == STATUS_CRITICAL:
        lab_test.flagged = True
        update_fields.append("flagged")

    # Set completion timestamp for completed + critical
    if new_status in {STATUS_CRITICAL, "completed"}:
        lab_test.completed_at = timezone.now()
        update_fields.append("completed_at")

    if key_findings:
        lab_test.key_findings = key_findings
        update_fields.append("key_findings")

    lab_test.save(update_fields=update_fields)

    _write_audit(
        action_type="update",
        entity_name="LabTest",
        entity_id=str(lab_test.id),
        user=updated_by,
        old_value={"status": old_status},
        new_value={"status": new_status, "flagged": lab_test.flagged},
    )

    logger.info("LabTest %s status: %s → %s", lab_test.id, old_status, new_status)
    return lab_test


# ─────────────────────────────────────────────────────────────────────────────
# Report File Upload (Append-only)
# ─────────────────────────────────────────────────────────────────────────────

@transaction.atomic
def upload_lab_report(
    lab_test: LabTest,
    file_url: str,
    file_type: str,
    notes: str = "",
    uploaded_by: object = None,
) -> LabReportFile:
    """
    Append a new report file to a lab test.

    Business Rules:
        BR-LAB-01: Append-only — creates a new LabReportFile row, never overwrites.
        Lab test must not be in 'pending' status (results only after work begins).

    Raises:
        ValueError: If lab test is still pending.
    """
    if lab_test.status == STATUS_PENDING:
        raise ValueError(
            f"Cannot upload report for lab test in '{STATUS_PENDING}' status. "
            "Move the test to 'in_progress' before uploading results. [BR-LAB-01]"
        )

    report_file = LabReportFile.objects.create(
        lab_test=lab_test,
        uploaded_by=uploaded_by,
        file_url=file_url,
        file_type=file_type,
        notes=notes,
        uploaded_at=timezone.now(),
        created_by=uploaded_by,
    )

    _write_audit(
        action_type="create",
        entity_name="LabReportFile",
        entity_id=str(report_file.id),
        user=uploaded_by,
        new_value={
            "lab_test_id": str(lab_test.id),
            "file_type": file_type,
            "file_url": file_url[:80],
        },
    )

    logger.info(
        "LabReportFile uploaded: id=%s lab_test=%s file_type=%s",
        report_file.id, lab_test.id, file_type,
    )
    return report_file


# ─────────────────────────────────────────────────────────────────────────────
# Flagging
# ─────────────────────────────────────────────────────────────────────────────

@transaction.atomic
def flag_lab_test(lab_test: LabTest, updated_by: object = None) -> LabTest:
    """
    Manually flag a lab test as requiring clinical attention.

    Status is not changed — flag can be set independently.
    For automatic flagging on critical status, see update_lab_status().
    """
    lab_test.flagged = True
    lab_test.save(update_fields=["flagged", "updated_at"])

    _write_audit(
        action_type="update",
        entity_name="LabTest",
        entity_id=str(lab_test.id),
        user=updated_by,
        old_value={"flagged": False},
        new_value={"flagged": True},
    )

    logger.info("LabTest %s flagged by %s", lab_test.id, updated_by)
    return lab_test


# ─────────────────────────────────────────────────────────────────────────────
# Queue & Flagged Results
# ─────────────────────────────────────────────────────────────────────────────

def get_lab_queue(
    urgency_filter: str | None = None,
    status_filter: str = STATUS_PENDING,
) -> QuerySet:
    """
    Return lab test queue ordered by STAT > Urgent > Routine, then requested_at ASC.

    Business Rule: BR-LAB-03 — STAT tests must appear at the top of the queue.

    Args:
        urgency_filter: Optional: 'stat' | 'urgent' | 'routine'
        status_filter: Default 'pending'. Can also filter by 'in_progress'.

    Returns:
        Annotated QuerySet ordered by urgency_priority then requested_at.
    """
    qs = LabTest.objects.filter(status=status_filter)

    if urgency_filter:
        qs = qs.filter(urgency=urgency_filter)

    urgency_order = Case(
        When(urgency=URGENCY_STAT, then=Value(0)),
        When(urgency=URGENCY_URGENT, then=Value(1)),
        default=Value(2),
        output_field=IntegerField(),
    )

    return (
        qs.annotate(urgency_order=urgency_order)
        .order_by("urgency_order", "requested_at")
        .select_related("patient", "ordered_by", "ordered_by__staff")
    )


def get_flagged_results(limit: int = 50) -> QuerySet:
    """
    Return flagged lab tests for the clinical alerts panel.

    Ordered by completed_at DESC (most recent critical results first).
    """
    return (
        LabTest.objects.filter(flagged=True)
        .select_related("patient", "ordered_by", "ordered_by__staff")
        .order_by("-completed_at")[:limit]
    )
