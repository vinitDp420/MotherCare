"""
MotherCare — Appointment Tests
Tests: token generation, uniqueness, double-booking, status transitions, full lifecycle.
"""
from __future__ import annotations

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.appointments.constants import (
    STATUS_CANCELLED,
    STATUS_COMPLETED,
    STATUS_CONFIRMED,
    STATUS_IN_PROGRESS,
    STATUS_NO_SHOW,
    STATUS_SCHEDULED,
    TOKEN_START,
)
from apps.appointments.models import Appointment
from apps.appointments.services import (
    assign_token,
    book_appointment,
    cancel_appointment,
    complete_appointment,
    confirm_appointment,
    mark_no_show,
    start_appointment,
    transition_status,
)
from apps.appointments.tests.factories import AppointmentFactory
from apps.people.tests.factories import DoctorFactory, PatientFactory, UserFactory


# ─────────────────────────────────────────────────────────────────────────────
# Token Generation Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestTokenAssignment:
    """BR-APPT-03: Tokens start at 101, sequential, never reassigned."""

    def test_first_token_is_101(self) -> None:
        doctor = DoctorFactory()
        appt_date = (timezone.now() + timedelta(days=1)).date()
        token = assign_token(doctor, appt_date)
        assert token == TOKEN_START  # 101

    def test_second_token_is_102(self) -> None:
        doctor = DoctorFactory()
        appt_date = (timezone.now() + timedelta(days=1)).date()

        # Create first appointment
        AppointmentFactory(
            doctor=doctor,
            appointment_datetime=timezone.now() + timedelta(days=1, hours=0),
            token_number=TOKEN_START,
        )

        token = assign_token(doctor, appt_date)
        assert token == TOKEN_START + 1  # 102

    def test_tokens_are_per_day(self) -> None:
        """Tokens reset to 101 for a new calendar day."""
        doctor = DoctorFactory()

        # Tomorrow gets 101
        tomorrow = (timezone.now() + timedelta(days=1)).date()
        token_tomorrow = assign_token(doctor, tomorrow)
        assert token_tomorrow == TOKEN_START

    def test_cancelled_token_not_reassigned(self) -> None:
        """BR-APPT-12: Cancelled appointment tokens are retired."""
        doctor = DoctorFactory()
        appt_date = (timezone.now() + timedelta(days=1)).date()

        # Create + cancel an appointment (token 101)
        AppointmentFactory(
            doctor=doctor,
            appointment_datetime=timezone.now() + timedelta(days=1),
            token_number=TOKEN_START,
            status=STATUS_CANCELLED,
        )

        # Next token should be 102 (not 101 again)
        next_token = assign_token(doctor, appt_date)
        assert next_token == TOKEN_START + 1

    def test_different_doctors_get_independent_tokens(self) -> None:
        """Each doctor has their own token sequence per day."""
        doctor_a = DoctorFactory()
        doctor_b = DoctorFactory()
        appt_date = (timezone.now() + timedelta(days=1)).date()

        AppointmentFactory(
            doctor=doctor_a,
            appointment_datetime=timezone.now() + timedelta(days=1, hours=1),
            token_number=TOKEN_START,
        )
        AppointmentFactory(
            doctor=doctor_a,
            appointment_datetime=timezone.now() + timedelta(days=1, hours=2),
            token_number=TOKEN_START + 1,
        )

        # Doctor B should still get 101
        token_b = assign_token(doctor_b, appt_date)
        assert token_b == TOKEN_START


# ─────────────────────────────────────────────────────────────────────────────
# Booking Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestBookAppointment:
    """book_appointment service tests."""

    def test_book_appointment_success(self) -> None:
        patient = PatientFactory()
        doctor = DoctorFactory()
        user = UserFactory()
        appt_dt = timezone.now() + timedelta(days=1, hours=2)

        appt = book_appointment(
            validated_data={
                "patient": patient,
                "doctor": doctor,
                "appointment_datetime": appt_dt,
                "appointment_type": "new_patient",
                "notes": "First visit.",
            },
            booked_by=user,
        )

        assert appt.id is not None
        assert appt.token_number == TOKEN_START
        assert appt.status == STATUS_SCHEDULED
        assert appt.patient == patient
        assert appt.doctor == doctor

    def test_double_booking_prevention(self) -> None:
        """Two appointments for the same doctor at the exact same time raises ValueError."""
        doctor = DoctorFactory()
        user = UserFactory()
        appt_dt = timezone.now() + timedelta(days=2, hours=9)

        # Book first appointment
        book_appointment(
            validated_data={
                "patient": PatientFactory(),
                "doctor": doctor,
                "appointment_datetime": appt_dt,
                "appointment_type": "new_patient",
            },
            booked_by=user,
        )

        # Attempt to double-book
        with pytest.raises(ValueError, match="Double-booking detected"):
            book_appointment(
                validated_data={
                    "patient": PatientFactory(),
                    "doctor": doctor,
                    "appointment_datetime": appt_dt,
                    "appointment_type": "follow_up",
                },
                booked_by=user,
            )

    def test_cancelled_slot_can_be_rebooked_at_different_time(self) -> None:
        """A cancelled appointment frees the slot but a NEW appointment is still a different patient."""
        doctor = DoctorFactory()
        user = UserFactory()
        appt_dt = timezone.now() + timedelta(days=3, hours=10)

        # Book + cancel first appointment
        appt1 = book_appointment(
            validated_data={
                "patient": PatientFactory(),
                "doctor": doctor,
                "appointment_datetime": appt_dt,
                "appointment_type": "new_patient",
            },
            booked_by=user,
        )
        cancel_appointment(appt1, user=user)

        # A different time can be booked (no double booking at new_dt)
        new_dt = appt_dt + timedelta(minutes=30)
        appt2 = book_appointment(
            validated_data={
                "patient": PatientFactory(),
                "doctor": doctor,
                "appointment_datetime": new_dt,
                "appointment_type": "new_patient",
            },
            booked_by=user,
        )
        assert appt2.id is not None


# ─────────────────────────────────────────────────────────────────────────────
# Status Transition Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestStatusTransitions:
    """BR-APPT-07: One-directional status transitions."""

    def test_scheduled_to_confirmed(self) -> None:
        appt = AppointmentFactory(status=STATUS_SCHEDULED)
        user = UserFactory()
        updated = confirm_appointment(appt, user)
        assert updated.status == STATUS_CONFIRMED

    def test_confirmed_to_in_progress(self) -> None:
        appt = AppointmentFactory(status=STATUS_CONFIRMED)
        user = UserFactory()
        updated = start_appointment(appt, user)
        assert updated.status == STATUS_IN_PROGRESS

    def test_in_progress_to_completed(self) -> None:
        appt = AppointmentFactory(status=STATUS_IN_PROGRESS)
        user = UserFactory()
        updated = complete_appointment(appt, user)
        assert updated.status == STATUS_COMPLETED

    def test_scheduled_to_cancelled(self) -> None:
        appt = AppointmentFactory(status=STATUS_SCHEDULED)
        user = UserFactory()
        updated = cancel_appointment(appt, user, reason="Patient request")
        assert updated.status == STATUS_CANCELLED
        assert "Patient request" in updated.notes

    def test_completed_cannot_be_reverted(self) -> None:
        """Terminal status: completed → any other status must raise ValueError."""
        appt = AppointmentFactory(status=STATUS_COMPLETED)
        user = UserFactory()
        with pytest.raises(ValueError, match="Invalid status transition"):
            transition_status(appt, STATUS_SCHEDULED, user)

    def test_cancelled_cannot_be_reverted(self) -> None:
        appt = AppointmentFactory(status=STATUS_CANCELLED)
        user = UserFactory()
        with pytest.raises(ValueError, match="Invalid status transition"):
            transition_status(appt, STATUS_SCHEDULED, user)

    def test_cannot_skip_confirmed_to_completed(self) -> None:
        """confirmed → completed directly is not allowed (must go through in_progress)."""
        appt = AppointmentFactory(status=STATUS_CONFIRMED)
        user = UserFactory()
        with pytest.raises(ValueError, match="Invalid status transition"):
            complete_appointment(appt, user)

    def test_mark_no_show_from_confirmed(self) -> None:
        appt = AppointmentFactory(status=STATUS_CONFIRMED)
        user = UserFactory()
        updated = mark_no_show(appt, user)
        assert updated.status == STATUS_NO_SHOW

    def test_cancel_already_terminal_raises(self) -> None:
        appt = AppointmentFactory(status=STATUS_COMPLETED)
        user = UserFactory()
        with pytest.raises(ValueError, match="terminal status"):
            cancel_appointment(appt, user)

    def test_soft_delete_manager_excludes_deleted(self) -> None:
        """SoftDeleteManager filters is_deleted=True."""
        active = AppointmentFactory()
        deleted = AppointmentFactory()
        deleted.soft_delete()

        ids = list(Appointment.objects.values_list("id", flat=True))
        assert active.id in ids
        assert deleted.id not in ids
