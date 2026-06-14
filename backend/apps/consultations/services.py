"""
MotherCare — Consultations Module Services
Architecture: CLAUDE.md — "Service layer: all business logic lives here"

Services:
    create_consultation(appointment, user)             — BR-CONS-01/02/03
    complete_consultation(consultation, data, user)    — BR-CONS-07 + BR-APPT-09
    cancel_consultation(consultation, user)
    update_clinical_notes(consultation, notes, user)   — Only for in_progress
    schedule_follow_up(consultation, follow_up_dt, user) — BR-CONS-09/10
    get_previous_prescriptions(patient)               — BR-CONS-05
"""
from __future__ import annotations

import logging
from datetime import datetime

from django.db import transaction
from django.utils import timezone

from apps.consultations.constants import (
    CONS_STATUS_CANCELLED,
    CONS_STATUS_COMPLETED,
    CONS_STATUS_IN_PROGRESS,
    CONSULTATION_TERMINAL_STATUSES,
)
from apps.consultations.models import Consultation

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
# Core Consultation CRUD
# ─────────────────────────────────────────────────────────────────────────────

@transaction.atomic
def create_consultation(
    appointment: object,
    created_by: object,
    clinical_notes: str = "",
    diagnosis: str = "",
) -> Consultation:
    """
    Create a Consultation for an Appointment.

    Business Rules:
        BR-CONS-01: UNIQUE(appointment_id) — enforced by OneToOneField
        BR-CONS-02: Appointment status must be 'confirmed' or 'in_progress'
        BR-CONS-03: patient + doctor copied from appointment, immutable
        BR-APPT-08: Appointment status auto-advances to 'in_progress'

    Args:
        appointment: Source Appointment instance.
        created_by: User (doctor/staff) creating the consultation.
        clinical_notes: Optional initial notes.
        diagnosis: Optional initial diagnosis text.

    Returns:
        Created Consultation instance.

    Raises:
        ValueError: If appointment status is invalid or consultation already exists.
    """
    from apps.appointments.constants import STATUS_CONFIRMED, STATUS_IN_PROGRESS
    from apps.appointments.services import start_appointment

    # BR-CONS-02: Check appointment status
    allowed_appt_statuses = {STATUS_CONFIRMED, STATUS_IN_PROGRESS}
    if appointment.status not in allowed_appt_statuses:
        raise ValueError(
            f"Cannot create consultation for appointment in '{appointment.status}' status. "
            f"Appointment must be 'confirmed' or 'in_progress'. [BR-CONS-02]"
        )

    # BR-CONS-01: Check for existing consultation (defensive — OneToOneField also enforces)
    if hasattr(appointment, "consultation") and appointment.consultation is not None:
        raise ValueError(
            f"Appointment {appointment.id} already has a consultation. "
            "One appointment = one consultation. [BR-CONS-01]"
        )

    # BR-APPT-08: Auto-advance appointment to in_progress
    if appointment.status == STATUS_CONFIRMED:
        start_appointment(appointment, user=created_by)

    consultation = Consultation.objects.create(
        appointment=appointment,
        patient=appointment.patient,       # BR-CONS-03: denormalised
        doctor=appointment.doctor,         # BR-CONS-03: denormalised
        start_time=timezone.now(),
        status=CONS_STATUS_IN_PROGRESS,
        clinical_notes=clinical_notes,
        diagnosis=diagnosis,
        created_by=created_by,
    )

    _write_audit(
        action_type="create",
        entity_name="Consultation",
        entity_id=str(consultation.id),
        user=created_by,
        new_value={
            "appointment_id": str(appointment.id),
            "patient_id": str(appointment.patient_id),
            "doctor_id": str(appointment.doctor_id),
        },
    )

    logger.info(
        "Consultation created: id=%s appt=%s patient=%s doctor=%s",
        consultation.id, appointment.id, appointment.patient_id, appointment.doctor_id,
    )
    return consultation


@transaction.atomic
def complete_consultation(
    consultation: Consultation,
    clinical_notes: str | None = None,
    diagnosis: str | None = None,
    updated_by: object = None,
) -> Consultation:
    """
    Complete a consultation.

    Business Rules:
        BR-CONS-07: Completed consultation is immutable (notes/Rx cannot be altered)
        BR-APPT-09: Appointment auto-advances to 'completed'
        Sets end_time to now().

    Raises:
        ValueError: If consultation is not in_progress.
    """
    from apps.appointments.services import complete_appointment

    if consultation.status != CONS_STATUS_IN_PROGRESS:
        raise ValueError(
            f"Cannot complete consultation in '{consultation.status}' status. "
            "Only in_progress consultations can be completed."
        )

    old_status = consultation.status
    update_fields = ["status", "end_time", "updated_at"]

    # Finalise clinical content before locking
    if clinical_notes is not None:
        consultation.clinical_notes = clinical_notes
        update_fields.append("clinical_notes")
    if diagnosis is not None:
        consultation.diagnosis = diagnosis
        update_fields.append("diagnosis")

    consultation.status = CONS_STATUS_COMPLETED
    consultation.end_time = timezone.now()
    consultation.save(update_fields=update_fields)

    # BR-APPT-09: Auto-complete appointment
    complete_appointment(consultation.appointment, user=updated_by)

    _write_audit(
        action_type="update",
        entity_name="Consultation",
        entity_id=str(consultation.id),
        user=updated_by,
        old_value={"status": old_status},
        new_value={"status": CONS_STATUS_COMPLETED, "end_time": str(consultation.end_time)},
    )

    logger.info("Consultation %s completed", consultation.id)
    return consultation


@transaction.atomic
def cancel_consultation(consultation: Consultation, user: object, reason: str = "") -> Consultation:
    """
    Cancel a consultation (must be in_progress).
    Note: does NOT automatically cancel the appointment.
    """
    if consultation.status != CONS_STATUS_IN_PROGRESS:
        raise ValueError(
            f"Cannot cancel consultation in '{consultation.status}' status. "
            "Only in_progress consultations can be cancelled."
        )

    consultation.status = CONS_STATUS_CANCELLED
    consultation.end_time = timezone.now()
    notes_addendum = f"\n[CANCELLED] {reason}".strip() if reason else ""
    consultation.clinical_notes = f"{consultation.clinical_notes}{notes_addendum}".strip()
    consultation.save(update_fields=["status", "end_time", "clinical_notes", "updated_at"])

    _write_audit(
        action_type="update",
        entity_name="Consultation",
        entity_id=str(consultation.id),
        user=user,
        old_value={"status": CONS_STATUS_IN_PROGRESS},
        new_value={"status": CONS_STATUS_CANCELLED},
    )
    return consultation


@transaction.atomic
def update_clinical_notes(
    consultation: Consultation,
    clinical_notes: str,
    diagnosis: str = "",
    updated_by: object = None,
) -> Consultation:
    """
    Update clinical notes / diagnosis while consultation is in_progress.

    BR-CONS-07: Completed consultations cannot be updated.
    """
    if consultation.status in CONSULTATION_TERMINAL_STATUSES:
        raise ValueError(
            f"Cannot edit a {consultation.status} consultation. "
            "Completed consultations are immutable. [BR-CONS-07]"
        )

    consultation.clinical_notes = clinical_notes
    if diagnosis:
        consultation.diagnosis = diagnosis
    consultation.save(update_fields=["clinical_notes", "diagnosis", "updated_at"])

    _write_audit(
        action_type="update",
        entity_name="Consultation",
        entity_id=str(consultation.id),
        user=updated_by,
        new_value={"clinical_notes_updated": True},
    )
    return consultation


# ─────────────────────────────────────────────────────────────────────────────
# Follow-Up Scheduling
# ─────────────────────────────────────────────────────────────────────────────

@transaction.atomic
def schedule_follow_up(
    consultation: Consultation,
    follow_up_datetime: datetime,
    notes: str = "",
    created_by: object = None,
) -> object:
    """
    Schedule a follow-up appointment from within a consultation.

    Business Rules:
        BR-CONS-09: Saves follow_up_datetime and creates a new follow_up Appointment.
        BR-CONS-10: Only one follow-up per consultation. If one exists, it must be
                    cancelled before a new one is created.

    Args:
        consultation: Source consultation.
        follow_up_datetime: Requested follow-up datetime.
        notes: Notes for the follow-up appointment.
        created_by: User scheduling the follow-up.

    Returns:
        Newly created Appointment instance (follow-up type).

    Raises:
        ValueError: If consultation is completed/cancelled or follow-up conflicts with BR-CONS-10.
    """
    from django.utils import timezone as tz

    from apps.appointments.constants import APPT_TYPE_FOLLOW_UP, STATUS_CANCELLED
    from apps.appointments.services import book_appointment
    if follow_up_datetime <= tz.now():
        raise ValueError("Follow-up datetime must be in the future.")

    # BR-CONS-10: Check existing follow-up appointment
    existing_follow_up = (
        consultation.appointment.patient.appointments  # type: ignore[attr-defined]
        .filter(
            appointment_type=APPT_TYPE_FOLLOW_UP,
            doctor=consultation.doctor,
            is_deleted=False,
        )
        .exclude(status=STATUS_CANCELLED)
        .filter(appointment_datetime=follow_up_datetime)
        .first()
    )
    if existing_follow_up:
        raise ValueError(
            "A follow-up appointment already exists for this patient at the requested datetime. "
            "Please cancel the existing follow-up first. [BR-CONS-10]"
        )

    # Save follow_up_datetime on consultation
    consultation.follow_up_datetime = follow_up_datetime
    consultation.save(update_fields=["follow_up_datetime", "updated_at"])

    # Create a new follow-up appointment
    follow_up_appt = book_appointment(
        validated_data={
            "patient": consultation.patient,
            "doctor": consultation.doctor,
            "appointment_datetime": follow_up_datetime,
            "appointment_type": APPT_TYPE_FOLLOW_UP,
            "notes": notes or f"Follow-up from consultation {consultation.id}",
        },
        booked_by=created_by,
    )

    _write_audit(
        action_type="create",
        entity_name="FollowUpAppointment",
        entity_id=str(follow_up_appt.id),
        user=created_by,
        new_value={
            "source_consultation": str(consultation.id),
            "follow_up_datetime": str(follow_up_datetime),
        },
    )

    logger.info(
        "Follow-up appointment %s created from consultation %s for %s",
        follow_up_appt.id, consultation.id, follow_up_datetime,
    )
    return follow_up_appt


# ─────────────────────────────────────────────────────────────────────────────
# Previous Prescriptions (BR-CONS-05)
# ─────────────────────────────────────────────────────────────────────────────

def get_previous_prescriptions(patient: object, limit: int = 5) -> list[dict]:
    """
    Fetch recent prescriptions for the prescription history panel.

    BR-CONS-05: SELECT * FROM prescription WHERE patient_id = ? ORDER BY issued_at DESC
    No junction table needed.

    Returns:
        List of prescription dicts (id, issued_at, consultation_id, notes).
    """
    try:
        from apps.prescriptions.models import Prescription
        prescriptions = Prescription.objects.filter(
            patient=patient,
        ).order_by("-issued_at").select_related("consultation")[:limit]

        return [
            {
                "id": str(rx.id),
                "issued_at": rx.issued_at.isoformat(),
                "consultation_id": str(rx.consultation_id),
                "notes": rx.notes,
            }
            for rx in prescriptions
        ]
    except Exception:  # noqa: BLE001
        logger.exception("Failed to fetch previous prescriptions for patient %s", patient)
        return []
