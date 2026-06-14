"""
MotherCare — Prescriptions Module Services
Architecture: CLAUDE.md — "Service layer: all business logic lives here"

Services:
    create_prescription(consultation, patient, notes, created_by)
    create_prescription_item(prescription, validated_data, created_by)
    create_full_prescription(consultation, patient, notes, items_data, created_by)
    get_patient_prescription_history(patient, limit=10)
    duplicate_previous_prescription(source, consultation, patient, created_by)

Business Rules:
    BR-RX-01: Prescriptions are IMMUTABLE — no update/delete services provided
    BR-RX-02: Consultation must be in_progress status
    BR-RX-03: Medicine FK enforced at DB level
"""
from __future__ import annotations

import logging
from typing import Any

from django.db import transaction
from django.db.models import QuerySet

from apps.prescriptions.models import Prescription, PrescriptionItem

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
    """Write AuditLog entry. Failures never re-raise."""
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
# Prescription CRUD (Create only — BR-RX-01)
# ─────────────────────────────────────────────────────────────────────────────

@transaction.atomic
def create_prescription(
    consultation: object,
    patient: object,
    notes: str = "",
    created_by: object = None,
) -> Prescription:
    """
    Create a Prescription record.

    Business Rules:
        BR-RX-02: Consultation must be in 'in_progress' status.
                  Completed consultations can also have prescriptions issued
                  (some workflows allow issuing after completion).

    Args:
        consultation: Source Consultation instance.
        patient: Patient instance (denormalised from consultation).
        notes: Optional prescription notes.
        created_by: User creating the prescription.

    Returns:
        Created Prescription instance.

    Raises:
        ValueError: If consultation is cancelled (prescriptions not allowed for cancelled consultations).
    """
    from apps.consultations.constants import CONS_STATUS_CANCELLED

    if consultation.status == CONS_STATUS_CANCELLED:
        raise ValueError(
            f"Cannot create prescription for a cancelled consultation ({consultation.id}). "
            "[BR-RX-02]"
        )

    prescription = Prescription.objects.create(
        consultation=consultation,
        patient=patient,
        notes=notes,
        created_by=created_by,
    )

    _write_audit(
        action_type="create",
        entity_name="Prescription",
        entity_id=str(prescription.id),
        user=created_by,
        new_value={
            "consultation_id": str(consultation.id),
            "patient_id": str(patient.id),
        },
    )

    logger.info(
        "Prescription created: id=%s consultation=%s patient=%s",
        prescription.id, consultation.id, patient.id,
    )
    return prescription


def create_prescription_item(
    prescription: Prescription,
    validated_data: dict[str, Any],
    created_by: object = None,
) -> PrescriptionItem:
    """
    Create a single PrescriptionItem.

    Business Rules:
        BR-RX-03: Medicine must be from the formulary (FK enforced at DB level).
        BR-RX-04: Append-only — one row per item, no updates.

    Args:
        prescription: Parent Prescription instance.
        validated_data: Dict with medicine, dosage, frequency, duration, instructions, sort_order.
        created_by: User creating the item.

    Returns:
        Created PrescriptionItem instance.
    """
    item = PrescriptionItem.objects.create(
        prescription=prescription,
        created_by=created_by,
        **validated_data,
    )
    return item


@transaction.atomic
def create_full_prescription(
    consultation: object,
    patient: object,
    notes: str = "",
    items_data: list[dict[str, Any]] | None = None,
    created_by: object = None,
) -> Prescription:
    """
    Create a complete Prescription with all its items in one atomic transaction.

    Steps:
        1. Create Prescription header
        2. For each item in items_data, create PrescriptionItem

    Args:
        consultation: Source Consultation instance.
        patient: Patient instance.
        notes: Optional prescription notes.
        items_data: List of item dicts: [{medicine, dosage, frequency, duration, instructions, sort_order}].
        created_by: User issuing the prescription.

    Returns:
        Created Prescription instance with all items attached.
    """
    prescription = create_prescription(
        consultation=consultation,
        patient=patient,
        notes=notes,
        created_by=created_by,
    )

    items_data = items_data or []
    for idx, item_data in enumerate(items_data):
        # Ensure sort_order if not supplied
        if "sort_order" not in item_data:
            item_data["sort_order"] = idx
        create_prescription_item(prescription, item_data, created_by=created_by)

    logger.info(
        "Full prescription created: id=%s items=%d",
        prescription.id, len(items_data),
    )
    return prescription


# ─────────────────────────────────────────────────────────────────────────────
# Prescription History
# ─────────────────────────────────────────────────────────────────────────────

def get_patient_prescription_history(
    patient: object,
    limit: int = 10,
) -> QuerySet:
    """
    Fetch prescription history for a patient.

    Architecture: BR-CONS-05 — Previous prescriptions served by querying
    Prescription WHERE patient_id = ? ORDER BY issued_at DESC.
    No junction table needed.

    Args:
        patient: Patient instance.
        limit: Maximum number of prescriptions to return (default 10).

    Returns:
        QuerySet of Prescriptions ordered by -issued_at.
    """
    return (
        Prescription.objects.filter(patient=patient)
        .select_related("consultation", "patient")
        .prefetch_related("items", "items__medicine")
        .order_by("-issued_at")[:limit]
    )


# ─────────────────────────────────────────────────────────────────────────────
# Duplicate / Re-prescribe
# ─────────────────────────────────────────────────────────────────────────────

@transaction.atomic
def duplicate_previous_prescription(
    source_prescription: Prescription,
    consultation: object,
    patient: object,
    created_by: object = None,
) -> Prescription:
    """
    Create a new Prescription by duplicating all items from a previous one.

    Use Case: "Re-prescribe" or "repeat prescription" workflow in consultation workspace.

    Steps:
        1. Create new Prescription with notes referencing the source
        2. Copy all PrescriptionItems from source with same dosage/frequency/duration/instructions

    Args:
        source_prescription: Prescription to duplicate.
        consultation: New (current) Consultation.
        patient: Patient (should match source_prescription.patient).
        created_by: User creating the duplicate.

    Returns:
        New Prescription instance with copied items.
    """
    new_notes = (
        f"Duplicated from Rx {source_prescription.id} "
        f"(issued {source_prescription.issued_at:%Y-%m-%d})"
    )

    new_prescription = create_prescription(
        consultation=consultation,
        patient=patient,
        notes=new_notes,
        created_by=created_by,
    )

    # Copy all items from source
    source_items = source_prescription.items.select_related("medicine").order_by("sort_order")
    for item in source_items:
        create_prescription_item(
            prescription=new_prescription,
            validated_data={
                "medicine": item.medicine,
                "dosage": item.dosage,
                "frequency": item.frequency,
                "duration": item.duration,
                "instructions": item.instructions,
                "sort_order": item.sort_order,
            },
            created_by=created_by,
        )

    _write_audit(
        action_type="create",
        entity_name="Prescription",
        entity_id=str(new_prescription.id),
        user=created_by,
        new_value={
            "duplicated_from": str(source_prescription.id),
            "item_count": source_items.count(),
        },
    )

    logger.info(
        "Prescription duplicated: source=%s new=%s items=%d",
        source_prescription.id, new_prescription.id, source_items.count(),
    )
    return new_prescription
