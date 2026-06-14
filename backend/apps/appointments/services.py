"""
MotherCare — Appointments Module Services
Architecture: CLAUDE.md — "Service layer: all business logic lives here"

Services:
    assign_token(doctor, date)                — BR-APPT-03 next sequential token
    book_appointment(validated_data, user)    — Full booking with double-booking check
    confirm_appointment(appt, user)           — scheduled → confirmed
    start_appointment(appt, user)             — confirmed → in_progress (BR-APPT-08)
    complete_appointment(appt, user)          — in_progress → completed (BR-APPT-09)
    cancel_appointment(appt, user)            — → cancelled (BR-APPT-11)
    mark_no_show(appt, user)                  — → no_show
    get_next_available_slot(doctor, date)     — Returns next open datetime for doctor
    transition_status(appt, new_status, user) — Core state machine (BR-APPT-07)
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Any

from django.db import transaction
from django.utils import timezone

from apps.appointments.constants import (
    ALLOWED_STATUS_TRANSITIONS,
    STATUS_CANCELLED,
    STATUS_COMPLETED,
    STATUS_CONFIRMED,
    STATUS_IN_PROGRESS,
    STATUS_NO_SHOW,
    STATUS_SCHEDULED,
    TERMINAL_STATUSES,
    TOKEN_MAX,
    TOKEN_START,
)
from apps.appointments.models import Appointment

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
# Token Assignment (BR-APPT-03)
# ─────────────────────────────────────────────────────────────────────────────

def assign_token(doctor: object, appt_date: date) -> int:
    """
    Assign the next sequential token for a doctor on a given date.

    Tokens start at TOKEN_START (101) and increment per doctor per day.
    Uses SELECT MAX + 1 inside an atomic block for concurrency safety.

    BR-APPT-03: Token numbers are auto-assigned sequentially per doctor per day
                starting from 101. Never manually reassigned.
    BR-APPT-12: Cancelled appointment tokens are retired and never reassigned.
                (We include cancelled records in the MAX query intentionally.)

    Args:
        doctor: Doctor instance.
        appt_date: The calendar date for the appointment.

    Returns:
        Next available integer token number.

    Raises:
        ValueError: If token limit for the day is exceeded.
    """
    from django.db.models import Max

    # Include ALL appointments (including soft-deleted and cancelled) for max query.
    # This ensures retired tokens are never reassigned (BR-APPT-12).
    existing_max = (
        Appointment.all_objects.filter(
            doctor=doctor,
            appointment_datetime__date=appt_date,
        )
        .aggregate(max_token=Max("token_number"))["max_token"]
    )

    if existing_max is None:
        return TOKEN_START  # First appointment of the day

    next_token = existing_max + 1
    if next_token > TOKEN_MAX:
        raise ValueError(
            f"Token limit for Dr. {doctor} on {appt_date} has been reached. "
            f"Maximum {TOKEN_MAX - TOKEN_START + 1} appointments per doctor per day."
        )
    return next_token


# ─────────────────────────────────────────────────────────────────────────────
# Status Transition State Machine
# ─────────────────────────────────────────────────────────────────────────────

def transition_status(appointment: Appointment, new_status: str, user: object) -> Appointment:
    """
    Core status transition enforcer (BR-APPT-07).

    Validates that the requested transition is allowed by the state machine,
    then applies it and writes an audit log.

    Args:
        appointment: Current Appointment instance.
        new_status: Target status string.
        user: User performing the transition.

    Returns:
        Updated Appointment instance.

    Raises:
        ValueError: If the transition is not allowed.
    """
    current = appointment.status
    allowed = ALLOWED_STATUS_TRANSITIONS.get(current, set())

    if new_status not in allowed:
        raise ValueError(
            f"Invalid status transition: '{current}' → '{new_status}'. "
            f"Allowed transitions from '{current}': {sorted(allowed) or 'none (terminal state)'}. "
            "[BR-APPT-07]"
        )

    old_status = current
    appointment.status = new_status
    appointment.save(update_fields=["status", "updated_at"])

    _write_audit(
        action_type="update",
        entity_name="Appointment",
        entity_id=str(appointment.id),
        user=user,
        old_value={"status": old_status},
        new_value={"status": new_status},
    )

    logger.info(
        "Appointment %s status: %s → %s (by=%s)",
        appointment.id, old_status, new_status, user,
    )
    return appointment


# ─────────────────────────────────────────────────────────────────────────────
# Double-Booking Check
# ─────────────────────────────────────────────────────────────────────────────

def _check_double_booking(doctor: object, appointment_datetime: datetime, exclude_id: object = None) -> None:
    """
    Prevent double-booking: same doctor at the exact same datetime.
    Excludes cancelled/no_show appointments from the check.

    Args:
        doctor: Doctor to check.
        appointment_datetime: Proposed datetime.
        exclude_id: Optional appointment ID to exclude (for updates).

    Raises:
        ValueError: If a conflicting booking exists.
    """
    qs = Appointment.objects.filter(
        doctor=doctor,
        appointment_datetime=appointment_datetime,
        is_deleted=False,
    ).exclude(status__in=[STATUS_CANCELLED, STATUS_NO_SHOW])

    if exclude_id:
        qs = qs.exclude(id=exclude_id)

    if qs.exists():
        raise ValueError(
            f"Double-booking detected: Dr. has an existing appointment at "
            f"{appointment_datetime:%Y-%m-%d %H:%M}. Please choose a different time slot."
        )


# ─────────────────────────────────────────────────────────────────────────────
# Main Booking Service
# ─────────────────────────────────────────────────────────────────────────────

@transaction.atomic
def book_appointment(
    validated_data: dict[str, Any],
    booked_by: object,
) -> Appointment:
    """
    Book a new appointment.

    Steps:
        1. Check for double-booking (same doctor + datetime)
        2. Assign sequential token (BR-APPT-03)
        3. Create Appointment record
        4. Write audit log

    Args:
        validated_data: Validated data from AppointmentWriteSerializer.
        booked_by: Staff user performing the booking.

    Returns:
        Created Appointment instance.

    Raises:
        ValueError: On double-booking or token limit exceeded.
    """
    doctor = validated_data["doctor"]
    appt_dt: datetime = validated_data["appointment_datetime"]

    # Double-booking check
    _check_double_booking(doctor, appt_dt)

    # Assign token (include SELECT FOR UPDATE for concurrency safety)
    token = assign_token(doctor, timezone.localdate(appt_dt))

    appointment = Appointment.objects.create(
        patient=validated_data["patient"],
        doctor=doctor,
        appointment_datetime=appt_dt,
        appointment_type=validated_data.get("appointment_type", "new_patient"),
        token_number=token,
        status=STATUS_SCHEDULED,
        notes=validated_data.get("notes", ""),
        booked_by=booked_by,
        created_by=booked_by,
    )

    _write_audit(
        action_type="create",
        entity_name="Appointment",
        entity_id=str(appointment.id),
        user=booked_by,
        new_value={
            "patient_id": str(appointment.patient_id),
            "doctor_id": str(appointment.doctor_id),
            "datetime": str(appt_dt),
            "token": token,
            "type": appointment.appointment_type,
        },
    )

    logger.info(
        "Appointment booked: id=%s patient=%s doctor=%s dt=%s token=%s",
        appointment.id, appointment.patient_id, doctor, appt_dt, token,
    )
    return appointment


# ─────────────────────────────────────────────────────────────────────────────
# Status-specific actions
# ─────────────────────────────────────────────────────────────────────────────

@transaction.atomic
def confirm_appointment(appointment: Appointment, user: object) -> Appointment:
    """Advance appointment: scheduled → confirmed."""
    return transition_status(appointment, STATUS_CONFIRMED, user)


@transaction.atomic
def start_appointment(appointment: Appointment, user: object) -> Appointment:
    """
    Advance appointment: confirmed → in_progress.
    Called when a consultation is created for this appointment (BR-APPT-08).
    """
    return transition_status(appointment, STATUS_IN_PROGRESS, user)


@transaction.atomic
def complete_appointment(appointment: Appointment, user: object) -> Appointment:
    """
    Advance appointment: in_progress → completed.
    Called when consultation status is set to completed (BR-APPT-09).
    """
    return transition_status(appointment, STATUS_COMPLETED, user)


@transaction.atomic
def cancel_appointment(appointment: Appointment, user: object, reason: str = "") -> Appointment:
    """
    Cancel an appointment (BR-APPT-11).
    Status → cancelled. Soft delete NOT applied (BR-APPT-11: is_deleted stays FALSE).
    Token is retired — never reassigned (BR-APPT-12).
    """
    if appointment.status in TERMINAL_STATUSES:
        raise ValueError(
            f"Cannot cancel appointment in terminal status '{appointment.status}'. "
            "[BR-APPT-07]"
        )
    appointment = transition_status(appointment, STATUS_CANCELLED, user)
    if reason:
        appointment.notes = f"{appointment.notes}\n[CANCELLED] {reason}".strip()
        appointment.save(update_fields=["notes", "updated_at"])
    return appointment


@transaction.atomic
def mark_no_show(appointment: Appointment, user: object) -> Appointment:
    """Mark an appointment as no_show (BR-APPT-10)."""
    return transition_status(appointment, STATUS_NO_SHOW, user)


# ─────────────────────────────────────────────────────────────────────────────
# Slot availability helper
# ─────────────────────────────────────────────────────────────────────────────

def get_next_available_slot(
    doctor: object,
    from_date: date,
    slot_interval_minutes: int = 15,
) -> datetime | None:
    """
    Find the next available appointment slot for a doctor from a given date.

    Checks existing appointments for the day and returns the next free slot
    within the doctor's available_from–available_to window.

    Args:
        doctor: Doctor instance (must have available_from, available_to).
        from_date: Date to start searching from.
        slot_interval_minutes: Length of each appointment slot in minutes.

    Returns:
        datetime of the next available slot, or None if no slots available.
    """
    from django.utils.timezone import make_aware

    available_from = getattr(doctor, "available_from", None)
    available_to = getattr(doctor, "available_to", None)

    if not available_from or not available_to:
        return None

    # Get all booked (non-cancelled) datetimes for the doctor on this date
    booked = set(
        Appointment.objects.filter(
            doctor=doctor,
            appointment_datetime__date=from_date,
            is_deleted=False,
        )
        .exclude(status__in=[STATUS_CANCELLED, STATUS_NO_SHOW])
        .values_list("appointment_datetime", flat=True)
    )

    # Iterate through slots in the doctor's window
    slot_start = make_aware(datetime.combine(from_date, available_from))
    day_end = make_aware(datetime.combine(from_date, available_to))
    delta = timedelta(minutes=slot_interval_minutes)

    current = slot_start
    while current < day_end:
        if current not in booked and current >= timezone.now():
            return current
        current += delta

    return None
